import { User, Group, Member, Payment, Period } from '../../types';
import { IDataAccess, JoinRequest } from './types';
export class LocalStorageDAO implements IDataAccess {
  private getItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
  private setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
  async getUserById(userId: string): Promise<User | null> {
    const users = this.getItem<User[]>('users') || [];
    return users.find(u => u.id === userId) || null;
  }
  async getUserByEmail(email: string): Promise<User | null> {
    const users = this.getItem<User[]>('users') || [];
    return users.find(u => u.email === email) || null;
  }
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const users = this.getItem<User[]>('users') || [];
    const newUser: User = {
      id: this.generateId(),
      ...user
    };
    users.push(newUser);
    this.setItem('users', users);
    return newUser;
  }
  async getGroupById(groupId: string): Promise<Group | null> {
    const groups = this.getItem<Group[]>('groups') || [];
    return groups.find(g => g.id === groupId) || null;
  }
  async getGroupsByUserId(userId: string): Promise<Group[]> {
    const groups = this.getItem<Group[]>('groups') || [];
    return groups.filter(g => g.memberships.some(m => m.userId === userId));
  }
  async createGroup(group: Omit<Group, 'id' | 'createdDate' | 'members' | 'payments' | 'periods'>): Promise<Group> {
    const groups = this.getItem<Group[]>('groups') || [];
    const newGroup: Group = {
      id: this.generateId(),
      createdDate: new Date().toISOString(),
      members: [],
      payments: [],
      periods: [],
      ...group
    };
    groups.push(newGroup);
    this.setItem('groups', groups);
    return newGroup;
  }
  async updateGroup(groupId: string, updates: Partial<Group>): Promise<void> {
    const groups = this.getItem<Group[]>('groups') || [];
    const index = groups.findIndex(g => g.id === groupId);
    if (index !== -1) {
      groups[index] = {
        ...groups[index],
        ...updates
      };
      this.setItem('groups', groups);
    }
  }
  async getMembersByGroupId(groupId: string): Promise<Member[]> {
    const group = await this.getGroupById(groupId);
    return group?.members || [];
  }
  async createMember(groupId: string, member: Omit<Member, 'id' | 'joinedDate'>): Promise<Member> {
    const groups = this.getItem<Group[]>('groups') || [];
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) throw new Error('Group not found');
    const newMember: Member = {
      id: this.generateId(),
      joinedDate: new Date().toISOString(),
      ...member
    };
    groups[groupIndex].members.push(newMember);
    this.setItem('groups', groups);
    return newMember;
  }
  async updateMember(groupId: string, memberId: string, updates: Partial<Member>): Promise<void> {
    const groups = this.getItem<Group[]>('groups') || [];
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;
    const memberIndex = groups[groupIndex].members.findIndex(m => m.id === memberId);
    if (memberIndex !== -1) {
      groups[groupIndex].members[memberIndex] = {
        ...groups[groupIndex].members[memberIndex],
        ...updates
      };
      this.setItem('groups', groups);
    }
  }
  async deleteMember(groupId: string, memberId: string): Promise<void> {
    const groups = this.getItem<Group[]>('groups') || [];
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;
    groups[groupIndex].members = groups[groupIndex].members.filter(m => m.id !== memberId);
    this.setItem('groups', groups);
  }
  async getPaymentsByGroupId(groupId: string): Promise<Payment[]> {
    const group = await this.getGroupById(groupId);
    return group?.payments || [];
  }
  async createPayment(groupId: string, payment: Payment): Promise<void> {
    const groups = this.getItem<Group[]>('groups') || [];
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;
    groups[groupIndex].payments.push(payment);
    this.setItem('groups', groups);
  }
  async getPeriodsByGroupId(groupId: string): Promise<Period[]> {
    const group = await this.getGroupById(groupId);
    return group?.periods || [];
  }
  async createPeriod(groupId: string, period: Period): Promise<void> {
    const groups = this.getItem<Group[]>('groups') || [];
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;
    groups[groupIndex].periods.push(period);
    this.setItem('groups', groups);
  }
  async updatePeriod(groupId: string, periodNumber: number, updates: Partial<Period>): Promise<void> {
    const groups = this.getItem<Group[]>('groups') || [];
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;
    const periodIndex = groups[groupIndex].periods.findIndex(p => p.number === periodNumber);
    if (periodIndex !== -1) {
      groups[groupIndex].periods[periodIndex] = {
        ...groups[groupIndex].periods[periodIndex],
        ...updates
      };
      this.setItem('groups', groups);
    }
  }
  async createJoinRequest(request: Omit<JoinRequest, 'id' | 'created_at'>): Promise<JoinRequest> {
    const requests = this.getItem<JoinRequest[]>('join_requests') || [];
    const newRequest: JoinRequest = {
      id: this.generateId(),
      created_at: new Date().toISOString(),
      ...request
    };
    requests.push(newRequest);
    this.setItem('join_requests', requests);
    return newRequest;
  }
  async getJoinRequestsByGroupId(groupId: string): Promise<JoinRequest[]> {
    const requests = this.getItem<JoinRequest[]>('join_requests') || [];
    return requests.filter(r => r.group_id === groupId && r.status === 'pending');
  }
  async updateJoinRequestStatus(requestId: string, status: 'approved' | 'rejected'): Promise<void> {
    const requests = this.getItem<JoinRequest[]>('join_requests') || [];
    const index = requests.findIndex(r => r.id === requestId);
    if (index !== -1) {
      requests[index].status = status;
      this.setItem('join_requests', requests);
    }
  }
}