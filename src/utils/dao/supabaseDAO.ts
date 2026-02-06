import { supabase } from '../supabase';
import { User, Group, Member, Payment, Period } from '../../types';
import { IDataAccess, JoinRequest } from './types';

export class SupabaseDAO implements IDataAccess {
  /**
   * Calculates computed Member fields that aren't stored in the database.
   * These are derived from related data.
   */
  private async calculateMemberComputedFields(
    groupId: string,
    memberId: string,
    userId: string
  ): Promise<{ hasReceived: boolean; missedPayments: number; scheduledPeriod: number }> {
    try {
      // Check if user has received a payout (been a period recipient)
      const { data: recipientData } = await supabase
        .from('periods')
        .select('id', { count: 'exact' })
        .eq('group_id', groupId)
        .eq('recipient_id', userId);

      const hasReceived = (recipientData?.length ?? 0) > 0;

      // Count missed payments
      const { data: missedPaymentsData } = await supabase.rpc(
        'count_missed_payments',
        {
          group_id: groupId,
          membership_id: memberId,
        }
      );

      const missedPayments = missedPaymentsData ?? 0;

      // Get next scheduled period
      const { data: nextPeriodData } = await supabase.rpc(
        'get_next_scheduled_period',
        { group_id: groupId }
      );

      const scheduledPeriod = nextPeriodData ?? 0;

      return { hasReceived, missedPayments, scheduledPeriod };
    } catch (error) {
      console.warn('Error calculating computed fields:', error);
      return {
        hasReceived: false,
        missedPayments: 0,
        scheduledPeriod: 0,
      };
    }
  }
  async getUserById(userId: string): Promise<User | null> {
    const {
      data,
      error
    } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return data;
  }
  async getUserByEmail(email: string): Promise<User | null> {
    const {
      data,
      error
    } = await supabase.from('users').select('*').eq('email', email).single();
    if (error || !data) return null;
    return data;
  }
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const {
      data,
      error
    } = await supabase.from('users').insert({
      name: user.name,
      email: user.email
    }).select().single();
    if (error) throw error;
    return data;
  }
  async getGroupById(groupId: string): Promise<Group | null> {
    const { data, error } = await supabase.rpc('get_group_by_id', {
      gid: groupId,
    });
    if (error || !data) return null;

    const groupData = data.group;
    const members = data.members ? this.mapMembers(data.members) : [];
    const payments = data.payments ? this.mapPayments(data.payments) : [];
    const periods = data.periods ? this.mapPeriods(data.periods) : [];
    const memberships = data.members ? data.members.map((m: any) => ({
      userId: m.user_id,
      role: m.role as 'admin' | 'member',
      joinedDate: m.created_at,
    })) : [];

    return this.mapToGroup(groupData, members, payments, periods, memberships);
  }
  async getGroupsByUserId(userId: string): Promise<Group[]> {
    const { data, error } = await supabase.rpc('get_groups_by_user', {
      uid: userId,
    });
    if (error || !data) return [];

    return data.map((item: any) => {
      const groupData = item.group;
      return this.mapToGroup(
        groupData,
        [],
        [],
        [],
        [{ userId, role: item.role, joinedDate: new Date() }]
      );
    });
  }
  async createGroup(group: Omit<Group, 'id' | 'createdDate' | 'members' | 'payments' | 'periods'>): Promise<Group> {
    const {
      data: newGroup,
      error
    } = await supabase.from('groups').insert({
      name: group.name,
      description: group.description || null,
      created_by: group.createdBy,
      club_name: group.club.name,
      contribution_amount: group.club.contributionAmount,
      frequency: group.club.frequency,
      current_period: group.club.currentPeriod,
      total_periods: group.club.totalPeriods,
      number_of_cycles: group.club.numberOfCycles,
      periods_per_cycle: group.club.periodsPerCycle,
      start_date: group.club.startDate
    }).select().single();
    if (error) throw error;
    // Create membership for creator
    await supabase.from('group_memberships').insert({
      group_id: newGroup.id,
      user_id: group.createdBy,
      role: 'admin'
    });
    return {
      id: newGroup.id,
      name: newGroup.name,
      description: newGroup.description || undefined,
      createdBy: newGroup.created_by,
      createdDate: newGroup.created_date,
      memberships: group.memberships,
      club: group.club,
      members: [],
      payments: [],
      periods: []
    };
  }
  async updateGroup(groupId: string, updates: Partial<Group>): Promise<void> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description || null;
    if (updates.club) {
      updateData.club_name = updates.club.name;
      updateData.contribution_amount = updates.club.contributionAmount;
      updateData.frequency = updates.club.frequency;
      updateData.current_period = updates.club.currentPeriod;
      updateData.total_periods = updates.club.totalPeriods;
      updateData.number_of_cycles = updates.club.numberOfCycles;
      updateData.periods_per_cycle = updates.club.periodsPerCycle;
      updateData.start_date = updates.club.startDate;
    }
    const {
      error
    } = await supabase.from('groups').update(updateData).eq('id', groupId);
    if (error) throw error;
  }
  async getMembersByGroupId(groupId: string): Promise<Member[]> {
    const { data, error } = await supabase.rpc('get_members_by_group_detailed', {
      gid: groupId,
    });
    if (error || !data) return [];

    // Add computed fields for each member
    const members = await Promise.all(
      data.map(async (m: any) => {
        const computed = await this.calculateMemberComputedFields(
          groupId,
          m.membership_id,
          m.user_id
        );
        return {
          id: m.membership_id,
          name: m.user_name,
          email: m.user_email,
          phone: m.user_phone || undefined,
          joinedDate: m.membership_created_at,
          ...computed,
        };
      })
    );

    return members;
  }
  async createMember(groupId: string, member: Omit<Member, 'id' | 'joinedDate'>): Promise<Member> {
    // First, check if user exists by email, otherwise create
    let userId: string;
    const existingUser = await this.getUserByEmail(member.email);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const newUser = await this.createUser({
        name: member.name,
        email: member.email,
      });
      userId = newUser.id;
    }

    // Create membership via group_memberships table
    const { data, error } = await supabase
      .from('group_memberships')
      .insert({
        user_id: userId,
        group_id: groupId,
        role: 'member',
      })
      .select()
      .single();

    if (error) throw error;

    const computed = await this.calculateMemberComputedFields(
      groupId,
      data.id,
      userId
    );

    return {
      id: data.id,
      name: member.name,
      email: member.email,
      phone: member.phone || undefined,
      joinedDate: data.created_at,
      ...computed,
    };
  }
  async updateMember(groupId: string, memberId: string, updates: Partial<Member>): Promise<void> {
    const updateData: any = {};
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;

    const { error } = await supabase
      .from('group_memberships')
      .update(updateData)
      .eq('id', memberId)
      .eq('group_id', groupId);

    if (error) throw error;
  }
  async deleteMember(groupId: string, memberId: string): Promise<void> {
    const { error } = await supabase
      .from('group_memberships')
      .update({ has_exited: true })
      .eq('id', memberId)
      .eq('group_id', groupId);

    if (error) throw error;
  }

  async createPayment(groupId: string, payment: Payment): Promise<void> {
    const { error } = await supabase.from('payments').insert({
      membership_id: payment.memberId,
      period_id: payment.period as any, // period field stores the period ID
      paid_amt: payment.amount,
    });

    if (error) throw error;
  }

  async createPeriod(groupId: string, period: Period): Promise<void> {
    const { error } = await supabase.from('periods').insert({
      group_id: groupId,
      number: period.number,
      recipient_id: period.recipientId,
      start_date: period.startDate,
      end_date: period.endDate,
      collected_amt: period.totalCollected,
      status: period.status,
    });

    if (error) throw error;
  }

  async updatePeriod(groupId: string, periodNumber: number, updates: Partial<Period>): Promise<void> {
    const updateData: any = {};

    if (updates.recipientId !== undefined) updateData.recipient_id = updates.recipientId;
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
    if (updates.totalCollected !== undefined) updateData.collected_amt = updates.totalCollected;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { error } = await supabase
      .from('periods')
      .update(updateData)
      .eq('group_id', groupId)
      .eq('number', periodNumber);

    if (error) throw error;
  }
  async getPaymentsByGroupId(groupId: string): Promise<Payment[]> {
    const { data, error } = await supabase.rpc('get_payments_by_group', {
      gid: groupId,
    });
    if (error || !data) return [];
    return this.mapPayments(data);
  }
  async getPeriodsByGroupId(groupId: string): Promise<Period[]> {
    const { data, error } = await supabase.rpc('get_periods_by_group', {
      gid: groupId,
    });
    if (error || !data) return [];
    return this.mapPeriods(data);
  }
  async createJoinRequest(request: Omit<JoinRequest, 'id' | 'created_at'>): Promise<JoinRequest> {
    const {
      data,
      error
    } = await supabase.from('join_requests').insert({
      group_id: request.group_id,
      user_id: request.user_id,
      user_name: request.user_name,
      user_email: request.user_email,
      message: request.message,
      status: request.status
    }).select().single();
    if (error) throw error;
    return data;
  }
  async getJoinRequestsByGroupId(groupId: string): Promise<JoinRequest[]> {
    const {
      data,
      error
    } = await supabase.from('join_requests').select('*').eq('group_id', groupId).eq('status', 'pending');
    if (error || !data) return [];
    return data;
  }
  async updateJoinRequestStatus(requestId: string, status: 'approved' | 'rejected'): Promise<void> {
    const { error } = await supabase.rpc('update_join_request_status', {
      request_id: requestId,
      new_status: status,
    });
    if (error) throw error;
  }
  private mapMembers(membersData: any[]): Member[] {
    return membersData.map(m => ({
      id: m.id,
      name: m.user_name || 'Unknown',
      email: m.user_email || '',
      phone: m.user_phone || undefined,
      joinedDate: m.membership_created_at,
      hasReceived: false,
      missedPayments: 0,
      scheduledPeriod: undefined,
    }));
  }

  private mapPayments(paymentsData: any[]): Payment[] {
    return paymentsData.map(p => ({
      memberId: p.membership_id,
      amount: p.paid_amt,
      date: p.updated_at,
      period: p.period_id,
    }));
  }

  private mapPeriods(periodsData: any[]): Period[] {
    return periodsData.map(p => ({
      number: p.number,
      recipientId: p.recipient_id,
      startDate: p.start_date,
      endDate: p.end_date,
      totalCollected: p.collected_amt,
      status: p.status as 'active' | 'completed' | 'upcoming',
    }));
  }

  private mapToGroup(groupData: any, members: Member[], payments: Payment[], periods: Period[], memberships: any[]): Group {
    return {
      id: groupData.id,
      name: groupData.name || groupData.group_name,
      description: groupData.description || undefined,
      createdBy: groupData.created_by,
      createdDate: groupData.created_at || groupData.created_date,
      memberships,
      club: {
        name: groupData.club_name || groupData.name || groupData.group_name,
        contributionAmount: groupData.contribution_amt || groupData.contribution_amount,
        frequency: groupData.frequency as 'weekly' | 'monthly',
        currentPeriod: groupData.current_period || 0,
        totalPeriods: groupData.total_periods || groupData.cycles || 0,
        numberOfCycles: groupData.number_of_cycles || groupData.cycles || 0,
        periodsPerCycle: groupData.periods_per_cycle || 1,
        startDate: groupData.start_date,
      },
      members,
      payments,
      periods,
    };
  }
}