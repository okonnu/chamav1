import { User, Group, Member, Payment, Period } from '../../types';
export interface JoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
export interface IDataAccess {
  // User operations
  getUserById(userId: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: Omit<User, 'id'>): Promise<User>;
  // Group operations
  getGroupById(groupId: string): Promise<Group | null>;
  getGroupsByUserId(userId: string): Promise<Group[]>;
  createGroup(group: Omit<Group, 'id' | 'createdDate' | 'members' | 'payments' | 'periods'>): Promise<Group>;
  updateGroup(groupId: string, updates: Partial<Group>): Promise<void>;
  // Member operations
  getMembersByGroupId(groupId: string): Promise<Member[]>;
  createMember(groupId: string, member: Omit<Member, 'id' | 'joinedDate'>): Promise<Member>;
  updateMember(groupId: string, memberId: string, updates: Partial<Member>): Promise<void>;
  deleteMember(groupId: string, memberId: string): Promise<void>;
  // Payment operations
  getPaymentsByGroupId(groupId: string): Promise<Payment[]>;
  createPayment(groupId: string, payment: Payment): Promise<void>;
  // Period operations
  getPeriodsByGroupId(groupId: string): Promise<Period[]>;
  createPeriod(groupId: string, period: Period): Promise<void>;
  updatePeriod(groupId: string, periodNumber: number, updates: Partial<Period>): Promise<void>;
  // Join request operations
  createJoinRequest(request: Omit<JoinRequest, 'id' | 'created_at'>): Promise<JoinRequest>;
  getJoinRequestsByGroupId(groupId: string): Promise<JoinRequest[]>;
  updateJoinRequestStatus(requestId: string, status: 'approved' | 'rejected'): Promise<void>;
}