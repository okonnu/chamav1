import { supabase } from '../supabase';
import { User, Group, Member, Payment, Period } from '../../types';
import { IDataAccess, JoinRequest } from './types';
export class SupabaseDAO implements IDataAccess {
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
    const {
      data: groupData,
      error
    } = await supabase.from('groups').select('*').eq('id', groupId).single();
    if (error || !groupData) return null;
    const [members, payments, periods, memberships] = await Promise.all([this.getMembersByGroupId(groupId), this.getPaymentsByGroupId(groupId), this.getPeriodsByGroupId(groupId), this.getMembershipsByGroupId(groupId)]);
    return this.mapToGroup(groupData, members, payments, periods, memberships);
  }
  async getGroupsByUserId(userId: string): Promise<Group[]> {
    const {
      data: memberships
    } = await supabase.from('group_memberships').select('*').eq('user_id', userId);
    if (!memberships) return [];
    const groupIds = memberships.map(m => m.group_id);
    const {
      data: groupsData
    } = await supabase.from('groups').select('*').in('id', groupIds);
    if (!groupsData) return [];
    const groups = await Promise.all(groupsData.map(async g => {
      const [members, payments, periods, allMemberships] = await Promise.all([this.getMembersByGroupId(g.id), this.getPaymentsByGroupId(g.id), this.getPeriodsByGroupId(g.id), this.getMembershipsByGroupId(g.id)]);
      return this.mapToGroup(g, members, payments, periods, allMemberships);
    }));
    return groups;
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
    const {
      data,
      error
    } = await supabase.from('members').select('*').eq('group_id', groupId);
    if (error || !data) return [];
    return data.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone || undefined,
      joinedDate: m.joined_date,
      hasReceived: m.has_received,
      missedPayments: m.missed_payments,
      scheduledPeriod: m.scheduled_period
    }));
  }
  async createMember(groupId: string, member: Omit<Member, 'id' | 'joinedDate'>): Promise<Member> {
    const {
      data,
      error
    } = await supabase.from('members').insert({
      group_id: groupId,
      name: member.name,
      email: member.email,
      phone: member.phone || null,
      has_received: member.hasReceived,
      missed_payments: member.missedPayments,
      scheduled_period: member.scheduledPeriod
    }).select().single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      joinedDate: data.joined_date,
      hasReceived: data.has_received,
      missedPayments: data.missed_payments,
      scheduledPeriod: data.scheduled_period
    };
  }
  async updateMember(groupId: string, memberId: string, updates: Partial<Member>): Promise<void> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.hasReceived !== undefined) updateData.has_received = updates.hasReceived;
    if (updates.missedPayments !== undefined) updateData.missed_payments = updates.missedPayments;
    if (updates.scheduledPeriod !== undefined) updateData.scheduled_period = updates.scheduledPeriod;
    const {
      error
    } = await supabase.from('members').update(updateData).eq('id', memberId).eq('group_id', groupId);
    if (error) throw error;
  }
  async deleteMember(groupId: string, memberId: string): Promise<void> {
    const {
      error
    } = await supabase.from('members').delete().eq('id', memberId).eq('group_id', groupId);
    if (error) throw error;
  }
  async getPaymentsByGroupId(groupId: string): Promise<Payment[]> {
    const {
      data,
      error
    } = await supabase.from('payments').select('*').eq('group_id', groupId);
    if (error || !data) return [];
    return data.map(p => ({
      memberId: p.member_id,
      amount: p.amount,
      date: p.date,
      period: p.period
    }));
  }
  async createPayment(groupId: string, payment: Payment): Promise<void> {
    const {
      error
    } = await supabase.from('payments').insert({
      group_id: groupId,
      member_id: payment.memberId,
      amount: payment.amount,
      date: payment.date,
      period: payment.period
    });
    if (error) throw error;
  }
  async getPeriodsByGroupId(groupId: string): Promise<Period[]> {
    const {
      data,
      error
    } = await supabase.from('periods').select('*').eq('group_id', groupId);
    if (error || !data) return [];
    return data.map(p => ({
      number: p.number,
      recipientId: p.recipient_id,
      startDate: p.start_date,
      endDate: p.end_date,
      totalCollected: p.total_collected,
      status: p.status as 'active' | 'completed' | 'upcoming'
    }));
  }
  async createPeriod(groupId: string, period: Period): Promise<void> {
    const {
      error
    } = await supabase.from('periods').insert({
      group_id: groupId,
      number: period.number,
      recipient_id: period.recipientId,
      start_date: period.startDate,
      end_date: period.endDate,
      total_collected: period.totalCollected,
      status: period.status
    });
    if (error) throw error;
  }
  async updatePeriod(groupId: string, periodNumber: number, updates: Partial<Period>): Promise<void> {
    const updateData: any = {};
    if (updates.recipientId) updateData.recipient_id = updates.recipientId;
    if (updates.startDate) updateData.start_date = updates.startDate;
    if (updates.endDate) updateData.end_date = updates.endDate;
    if (updates.totalCollected !== undefined) updateData.total_collected = updates.totalCollected;
    if (updates.status) updateData.status = updates.status;
    const {
      error
    } = await supabase.from('periods').update(updateData).eq('group_id', groupId).eq('number', periodNumber);
    if (error) throw error;
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
    const {
      error
    } = await supabase.from('join_requests').update({
      status
    }).eq('id', requestId);
    if (error) throw error;
  }
  private async getMembershipsByGroupId(groupId: string) {
    const {
      data
    } = await supabase.from('group_memberships').select('*').eq('group_id', groupId);
    return (data || []).map(m => ({
      userId: m.user_id,
      role: m.role as 'admin' | 'member',
      joinedDate: m.joined_date
    }));
  }
  private mapToGroup(groupData: any, members: Member[], payments: Payment[], periods: Period[], memberships: any[]): Group {
    return {
      id: groupData.id,
      name: groupData.name,
      description: groupData.description || undefined,
      createdBy: groupData.created_by,
      createdDate: groupData.created_date,
      memberships,
      club: {
        name: groupData.club_name,
        contributionAmount: groupData.contribution_amount,
        frequency: groupData.frequency as 'weekly' | 'monthly',
        currentPeriod: groupData.current_period,
        totalPeriods: groupData.total_periods,
        numberOfCycles: groupData.number_of_cycles,
        periodsPerCycle: groupData.periods_per_cycle,
        startDate: groupData.start_date
      },
      members,
      payments,
      periods
    };
  }
}