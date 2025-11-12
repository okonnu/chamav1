import { User, Group } from '../types';
export function generateDemoData(): {
  user: User;
  groups: Group[];
} {
  const demoUser: User = {
    id: 'demo-user-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com'
  };
  const demoGroups: Group[] = [{
    id: 'group-1',
    name: 'Family Investment Circle',
    description: 'Monthly savings group for family members',
    createdBy: demoUser.id,
    createdDate: '2024-01-01T00:00:00.000Z',
    memberships: [{
      userId: demoUser.id,
      role: 'admin',
      joinedDate: '2024-01-01T00:00:00.000Z'
    }],
    club: {
      name: 'Family Investment Circle',
      contributionAmount: 500,
      frequency: 'monthly',
      currentPeriod: 3,
      totalPeriods: 12,
      numberOfCycles: 2,
      periodsPerCycle: 6,
      startDate: '2024-01-01T00:00:00.000Z'
    },
    members: [{
      id: 'member-1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
      joinedDate: '2024-01-01T00:00:00.000Z',
      hasReceived: false,
      missedPayments: 0,
      scheduledPeriod: 1
    }, {
      id: 'member-2',
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      phone: '+1 (555) 234-5678',
      joinedDate: '2024-01-01T00:00:00.000Z',
      hasReceived: false,
      missedPayments: 2,
      scheduledPeriod: 2
    }, {
      id: 'member-3',
      name: 'Michael Brown',
      email: 'michael.brown@example.com',
      phone: '+1 (555) 345-6789',
      joinedDate: '2024-01-01T00:00:00.000Z',
      hasReceived: false,
      missedPayments: 0,
      scheduledPeriod: 3
    }, {
      id: 'member-4',
      name: 'Lisa Anderson',
      email: 'lisa.anderson@example.com',
      phone: '+1 (555) 456-7890',
      joinedDate: '2024-01-01T00:00:00.000Z',
      hasReceived: false,
      missedPayments: 1,
      scheduledPeriod: 4
    }, {
      id: 'member-5',
      name: 'David Wilson',
      email: 'david.wilson@example.com',
      phone: '+1 (555) 567-8901',
      joinedDate: '2024-01-01T00:00:00.000Z',
      hasReceived: false,
      missedPayments: 0,
      scheduledPeriod: 5
    }, {
      id: 'member-6',
      name: 'Jennifer Martinez',
      email: 'jennifer.martinez@example.com',
      phone: '+1 (555) 678-9012',
      joinedDate: '2024-01-01T00:00:00.000Z',
      hasReceived: false,
      missedPayments: 0,
      scheduledPeriod: 6
    }],
    payments: [
    // Period 1 payments
    {
      memberId: 'member-1',
      amount: 500,
      date: '2024-01-15T00:00:00.000Z',
      period: 1
    }, {
      memberId: 'member-3',
      amount: 500,
      date: '2024-01-16T00:00:00.000Z',
      period: 1
    }, {
      memberId: 'member-4',
      amount: 500,
      date: '2024-01-17T00:00:00.000Z',
      period: 1
    }, {
      memberId: 'member-5',
      amount: 500,
      date: '2024-01-18T00:00:00.000Z',
      period: 1
    }, {
      memberId: 'member-6',
      amount: 500,
      date: '2024-01-19T00:00:00.000Z',
      period: 1
    },
    // Period 2 payments
    {
      memberId: 'member-1',
      amount: 500,
      date: '2024-02-15T00:00:00.000Z',
      period: 2
    }, {
      memberId: 'member-3',
      amount: 500,
      date: '2024-02-16T00:00:00.000Z',
      period: 2
    }, {
      memberId: 'member-4',
      amount: 500,
      date: '2024-02-17T00:00:00.000Z',
      period: 2
    }, {
      memberId: 'member-5',
      amount: 500,
      date: '2024-02-18T00:00:00.000Z',
      period: 2
    }, {
      memberId: 'member-6',
      amount: 500,
      date: '2024-02-19T00:00:00.000Z',
      period: 2
    },
    // Period 3 payments (current - partial)
    {
      memberId: 'member-1',
      amount: 500,
      date: '2024-03-15T00:00:00.000Z',
      period: 3
    }, {
      memberId: 'member-3',
      amount: 500,
      date: '2024-03-16T00:00:00.000Z',
      period: 3
    }, {
      memberId: 'member-5',
      amount: 500,
      date: '2024-03-18T00:00:00.000Z',
      period: 3
    }],
    periods: [{
      number: 1,
      recipientId: 'member-1',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-31T00:00:00.000Z',
      totalCollected: 2500,
      status: 'completed'
    }, {
      number: 2,
      recipientId: 'member-3',
      startDate: '2024-02-01T00:00:00.000Z',
      endDate: '2024-02-29T00:00:00.000Z',
      totalCollected: 2500,
      status: 'completed'
    }, {
      number: 3,
      recipientId: 'member-5',
      startDate: '2024-03-01T00:00:00.000Z',
      endDate: '2024-03-31T00:00:00.000Z',
      totalCollected: 1500,
      status: 'active'
    }]
  }, {
    id: 'group-2',
    name: 'Community Builders Fund',
    description: 'Weekly savings for small business owners',
    createdBy: demoUser.id,
    createdDate: '2024-02-01T00:00:00.000Z',
    memberships: [{
      userId: demoUser.id,
      role: 'admin',
      joinedDate: '2024-02-01T00:00:00.000Z'
    }],
    club: {
      name: 'Community Builders Fund',
      contributionAmount: 100,
      frequency: 'weekly',
      currentPeriod: 1,
      totalPeriods: 8,
      numberOfCycles: 2,
      periodsPerCycle: 4,
      startDate: '2024-02-01T00:00:00.000Z'
    },
    members: [{
      id: 'member-7',
      name: 'Robert Taylor',
      email: 'robert.taylor@example.com',
      joinedDate: '2024-02-01T00:00:00.000Z',
      hasReceived: false,
      missedPayments: 0,
      scheduledPeriod: 1
    }, {
      id: 'member-8',
      name: 'Patricia Moore',
      email: 'patricia.moore@example.com',
      joinedDate: '2024-02-01T00:00:00.000Z',
      hasReceived: false,
      missedPayments: 0,
      scheduledPeriod: 2
    }, {
      id: 'member-9',
      name: 'Christopher Lee',
      email: 'christopher.lee@example.com',
      joinedDate: '2024-02-01T00:00:00.000Z',
      hasReceived: false,
      missedPayments: 0,
      scheduledPeriod: 3
    }, {
      id: 'member-10',
      name: 'Maria Garcia',
      email: 'maria.garcia@example.com',
      joinedDate: '2024-02-01T00:00:00.000Z',
      hasReceived: false,
      missedPayments: 0,
      scheduledPeriod: 4
    }],
    payments: [],
    periods: [{
      number: 1,
      recipientId: 'member-7',
      startDate: '2024-02-01T00:00:00.000Z',
      endDate: '2024-02-07T00:00:00.000Z',
      totalCollected: 0,
      status: 'active'
    }]
  }];
  return {
    user: demoUser,
    groups: demoGroups
  };
}