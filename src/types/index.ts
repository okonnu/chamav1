export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinedDate: string;
  hasReceived: boolean;
  missedPayments: number;
  scheduledPeriod: number;
}
export interface Payment {
  memberId: string;
  amount: number;
  date: string;
  period: number;
}
export interface Period {
  number: number;
  recipientId: string;
  startDate: string;
  endDate: string;
  totalCollected: number;
  status: 'active' | 'completed' | 'upcoming';
}
export interface Club {
  name: string;
  contributionAmount: number;
  frequency: 'weekly' | 'monthly';
  currentPeriod: number;
  totalPeriods: number;
  numberOfCycles: number;
  periodsPerCycle: number;
  startDate: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
}
export interface GroupMembership {
  userId: string;
  role: 'admin' | 'member';
  joinedDate: string;
}
export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdDate: string;
  memberships: GroupMembership[];
  club: Club;
  members: Member[];
  payments: Payment[];
  periods: Period[];
}