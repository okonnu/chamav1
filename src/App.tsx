import React, { useEffect, useState } from 'react';
import { Login } from './components/Login';
import { GroupList } from './components/GroupList';
import { Dashboard } from './components/Dashboard';
import { MemberList } from './components/MemberList';
import { PaymentTracker } from './components/PaymentTracker';
import { RotationSchedule } from './components/RotationSchedule';
import { ClubSettings } from './components/ClubSettings';
import { User, Group, Club, Member, Payment, Period, GroupMembership } from './types';
import { dataAccess } from './utils/dao';
import { UsersIcon, DollarSignIcon, CalendarIcon, SettingsIcon, LayoutDashboardIcon, ArrowLeftIcon } from 'lucide-react';
export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);
  // Load user and groups using DAO
  useEffect(() => {
    loadUserData();
  }, []);
  const loadUserData = async () => {
    try {
      const savedUserId = localStorage.getItem('currentUserId');
      if (savedUserId) {
        const user = await dataAccess.getUserById(savedUserId);
        if (user) {
          setCurrentUser(user);
          await loadGroups(user.id);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };
  const loadGroups = async (userId: string) => {
    try {
      const userGroups = await dataAccess.getGroupsByUserId(userId);
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };
  const handleLogin = async (user: User) => {
    try {
      console.log('Attempting login for:', user.email);
      const existingUser = await dataAccess.getUserByEmail(user.email);
      if (existingUser) {
        console.log('Existing user found:', existingUser);
        setCurrentUser(existingUser);
        localStorage.setItem('currentUserId', existingUser.id);
        await loadGroups(existingUser.id);
      } else {
        console.log('Creating new user:', user);
        const newUser = await dataAccess.createUser({
          name: user.name,
          email: user.email
        });
        console.log('New user created:', newUser);
        setCurrentUser(newUser);
        localStorage.setItem('currentUserId', newUser.id);
      }
    } catch (error) {
      console.error('Error during login:', error);
      // Show error to user
      alert('Login failed. Please try again.');
    }
  };
  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedGroup(null);
    setActiveTab('dashboard');
    localStorage.removeItem('currentUserId');
  };
  const handleCreateGroup = async (name: string, description: string) => {
    if (!currentUser) return;
    try {
      const newGroup = await dataAccess.createGroup({
        name,
        description: description || undefined,
        createdBy: currentUser.id,
        memberships: [{
          userId: currentUser.id,
          role: 'admin',
          joinedDate: new Date().toISOString()
        }],
        club: {
          name,
          contributionAmount: 100,
          frequency: 'monthly',
          currentPeriod: 1,
          totalPeriods: 0,
          numberOfCycles: 1,
          periodsPerCycle: 1,
          startDate: new Date().toISOString()
        }
      });
      await loadGroups(currentUser.id);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };
  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setActiveTab('dashboard');
  };
  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setActiveTab('dashboard');
  };
  const updateSelectedGroup = async (updatedGroup: Group) => {
    setSelectedGroup(updatedGroup);
    setGroups(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
    try {
      await dataAccess.updateGroup(updatedGroup.id, updatedGroup);
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };
  const isAdmin = () => {
    if (!currentUser || !selectedGroup) return false;
    const membership = selectedGroup.memberships.find(m => m.userId === currentUser.id);
    return membership?.role === 'admin';
  };
  const handleNavigateToPayments = (periodNumber: number) => {
    setActiveTab('payments');
  };
  if (loading) {
    return <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>;
  }
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }
  if (!selectedGroup) {
    return <GroupList user={currentUser} groups={groups} onSelectGroup={handleSelectGroup} onCreateGroup={handleCreateGroup} onLogout={handleLogout} onRefresh={() => loadGroups(currentUser.id)} />;
  }
  const tabs = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboardIcon
  }, {
    id: 'members',
    label: 'Members',
    icon: UsersIcon
  }, {
    id: 'payments',
    label: 'Payments',
    icon: DollarSignIcon
  }, {
    id: 'schedule',
    label: 'Schedule',
    icon: CalendarIcon
  }, {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon
  }];
  return <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={handleBackToGroups} className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DollarSignIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gray-900">
                  {selectedGroup.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {isAdmin() ? 'Administrator' : 'Member'} • ROSCA Management
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map(tab => {
            const Icon = tab.icon;
            return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>;
          })}
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard club={selectedGroup.club} members={selectedGroup.members} payments={selectedGroup.payments} periods={selectedGroup.periods} />}
        {activeTab === 'members' && <MemberList members={selectedGroup.members} setMembers={members => updateSelectedGroup({
        ...selectedGroup,
        members
      })} club={selectedGroup.club} setClub={club => updateSelectedGroup({
        ...selectedGroup,
        club
      })} periods={selectedGroup.periods} setPeriods={periods => updateSelectedGroup({
        ...selectedGroup,
        periods
      })} payments={selectedGroup.payments} isAdmin={isAdmin()} currentUser={currentUser} />}
        {activeTab === 'payments' && <PaymentTracker club={selectedGroup.club} members={selectedGroup.members} payments={selectedGroup.payments} setPayments={payments => updateSelectedGroup({
        ...selectedGroup,
        payments
      })} periods={selectedGroup.periods} setPeriods={periods => updateSelectedGroup({
        ...selectedGroup,
        periods
      })} setMembers={members => updateSelectedGroup({
        ...selectedGroup,
        members
      })} />}
        {activeTab === 'schedule' && <RotationSchedule members={selectedGroup.members} periods={selectedGroup.periods} club={selectedGroup.club} onPeriodClick={handleNavigateToPayments} />}
        {activeTab === 'settings' && <ClubSettings club={selectedGroup.club} setClub={club => updateSelectedGroup({
        ...selectedGroup,
        club
      })} members={selectedGroup.members} isAdmin={isAdmin()} />}
      </main>
    </div>;
}