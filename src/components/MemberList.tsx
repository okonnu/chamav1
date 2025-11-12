import React, { useState } from 'react';
import { Member, Club, Period, Payment, User } from '../types';
import { PlusIcon, TrashIcon, MailIcon, PhoneIcon, UsersIcon, ShieldCheckIcon, AlertCircleIcon } from 'lucide-react';
interface MemberListProps {
  members: Member[];
  setMembers: (members: Member[]) => void;
  club: Club;
  setClub: (club: Club) => void;
  periods: Period[];
  setPeriods: (periods: Period[]) => void;
  payments: Payment[];
  isAdmin: boolean;
  currentUser: User;
}
export function MemberList({
  members,
  setMembers,
  club,
  setClub,
  periods,
  setPeriods,
  payments,
  isAdmin,
  currentUser
}: MemberListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const getPaymentStatus = (member: Member) => {
    if (member.missedPayments >= 2) {
      return {
        color: 'bg-red-100 border-red-300',
        textColor: 'text-red-800',
        label: 'Defaulting',
        icon: '🔴'
      };
    } else if (member.missedPayments === 0) {
      return {
        color: 'bg-green-100 border-green-300',
        textColor: 'text-green-800',
        label: 'Up to Date',
        icon: '🟢'
      };
    } else {
      return {
        color: 'bg-blue-100 border-blue-300',
        textColor: 'text-blue-800',
        label: '1 Missed',
        icon: '🔵'
      };
    }
  };
  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) return;
    const member: Member = {
      id: Date.now().toString(),
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone,
      joinedDate: new Date().toISOString(),
      hasReceived: false,
      missedPayments: 0,
      scheduledPeriod: members.length + 1
    };
    const updatedMembers = [...members, member];
    setMembers(updatedMembers);
    const updatedClub = {
      ...club,
      periodsPerCycle: Math.max(club.periodsPerCycle, updatedMembers.length),
      totalPeriods: Math.max(club.periodsPerCycle, updatedMembers.length) * club.numberOfCycles
    };
    setClub(updatedClub);
    if (periods.length < updatedMembers.length) {
      const newPeriod: Period = {
        number: periods.length + 1,
        recipientId: member.id,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        totalCollected: 0,
        status: periods.length === 0 ? 'active' : 'upcoming'
      };
      setPeriods([...periods, newPeriod]);
    }
    setNewMember({
      name: '',
      email: '',
      phone: ''
    });
    setShowAddModal(false);
  };
  const handleRemoveMember = (id: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      const updatedMembers = members.filter(m => m.id !== id);
      setMembers(updatedMembers);
      const updatedPeriodsPerCycle = Math.max(1, updatedMembers.length);
      setClub({
        ...club,
        periodsPerCycle: updatedPeriodsPerCycle,
        totalPeriods: updatedPeriodsPerCycle * club.numberOfCycles
      });
    }
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Members</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isAdmin ? 'Manage your investment club members' : 'View investment club members'}
          </p>
        </div>
        {isAdmin && <button onClick={() => setShowAddModal(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Member
          </button>}
      </div>
      {!isAdmin && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            You are viewing this group as a member. Only administrators can add
            or remove members.
          </p>
        </div>}
      {/* Payment Status Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Payment Status Legend
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <span className="text-lg mr-2">🟢</span>
            <span className="text-sm text-gray-700">Up to Date (0 missed)</span>
          </div>
          <div className="flex items-center">
            <span className="text-lg mr-2">🔵</span>
            <span className="text-sm text-gray-700">1 Missed Payment</span>
          </div>
          <div className="flex items-center">
            <span className="text-lg mr-2">🔴</span>
            <span className="text-sm text-gray-700">
              Defaulting (2+ missed)
            </span>
          </div>
        </div>
      </div>
      {members.length === 0 ? <div className="bg-white rounded-lg shadow p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No members yet
          </h3>
          <p className="text-gray-600 mb-6">
            {isAdmin ? 'Get started by adding your first member' : 'The administrator has not added any members yet'}
          </p>
          {isAdmin && <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Add First Member
            </button>}
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map(member => {
        const status = getPaymentStatus(member);
        return <div key={member.id} className={`bg-white rounded-lg shadow p-6 border-2 ${status.color}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg font-bold text-blue-600">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-2xl">{status.icon}</span>
                  </div>
                  {isAdmin && <button onClick={() => handleRemoveMember(member.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                      <TrashIcon className="w-5 h-5" />
                    </button>}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MailIcon className="w-4 h-4 mr-2" />
                    {member.email}
                  </div>
                  {member.phone && <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="w-4 h-4 mr-2" />
                      {member.phone}
                    </div>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} ${status.textColor}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Missed Payments</span>
                    <span className="font-medium text-gray-900">
                      {member.missedPayments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Scheduled Period</span>
                    <span className="font-medium text-gray-900">
                      Period {member.scheduledPeriod + member.missedPayments}
                    </span>
                  </div>
                  {member.missedPayments >= 2 && <div className="mt-3 flex items-start text-xs text-red-700 bg-red-50 p-2 rounded">
                      <AlertCircleIcon className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                      <span>
                        Payout delayed by {member.missedPayments} period
                        {member.missedPayments > 1 ? 's' : ''}
                      </span>
                    </div>}
                </div>
              </div>;
      })}
        </div>}
      {/* Add Member Modal */}
      {showAddModal && isAdmin && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">
                Add New Member
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input type="text" value={newMember.name} onChange={e => setNewMember({
              ...newMember,
              name: e.target.value
            })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input type="email" value={newMember.email} onChange={e => setNewMember({
              ...newMember,
              email: e.target.value
            })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (Optional)
                </label>
                <input type="tel" value={newMember.phone} onChange={e => setNewMember({
              ...newMember,
              phone: e.target.value
            })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleAddMember} disabled={!newMember.name || !newMember.email} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                Add Member
              </button>
            </div>
          </div>
        </div>}
    </div>;
}