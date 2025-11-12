import React, { useEffect, useState } from 'react';
import { Club, Member, Payment, Period } from '../types';
import { CheckCircleIcon, XCircleIcon, DollarSignIcon } from 'lucide-react';
interface PaymentTrackerProps {
  club: Club;
  members: Member[];
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  periods: Period[];
  setPeriods: (periods: Period[]) => void;
  setMembers: (members: Member[]) => void;
}
export function PaymentTracker({
  club,
  members,
  payments,
  setPayments,
  periods,
  setPeriods,
  setMembers
}: PaymentTrackerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(club.currentPeriod);
  const currentPeriodPayments = payments.filter(p => p.period === selectedPeriod);
  const hasPaid = (memberId: string) => {
    return currentPeriodPayments.some(p => p.memberId === memberId);
  };
  const updateMissedPayments = () => {
    const updatedMembers = members.map(member => {
      // Count missed payments for periods before current
      let missedCount = 0;
      for (let period = 1; period < club.currentPeriod; period++) {
        const paidInPeriod = payments.some(p => p.memberId === member.id && p.period === period);
        if (!paidInPeriod) {
          missedCount++;
        }
      }
      return {
        ...member,
        missedPayments: missedCount
      };
    });
    setMembers(updatedMembers);
  };
  useEffect(() => {
    updateMissedPayments();
  }, [payments, club.currentPeriod]);
  const handleMarkPaid = (memberId: string) => {
    if (hasPaid(memberId)) {
      // Remove payment
      const updatedPayments = payments.filter(p => !(p.memberId === memberId && p.period === selectedPeriod));
      setPayments(updatedPayments);
    } else {
      // Add payment
      const newPayment: Payment = {
        memberId,
        amount: club.contributionAmount,
        date: new Date().toISOString(),
        period: selectedPeriod
      };
      setPayments([...payments, newPayment]);
    }
  };
  const totalCollected = currentPeriodPayments.reduce((sum, p) => sum + p.amount, 0);
  const expectedTotal = members.length * club.contributionAmount;
  const paidCount = currentPeriodPayments.length;
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Tracker</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track member contributions for each period
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select value={selectedPeriod} onChange={e => setSelectedPeriod(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            {Array.from({
            length: club.totalPeriods || 1
          }, (_, i) => i + 1).map(period => <option key={period} value={period}>
                Period {period}
              </option>)}
          </select>
        </div>
      </div>
      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Collected</p>
            <p className="text-3xl font-bold text-green-600">
              ${totalCollected}
            </p>
            <p className="text-sm text-gray-500 mt-1">of ${expectedTotal}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Members Paid</p>
            <p className="text-3xl font-bold text-blue-600">
              {paidCount}/{members.length}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {members.length - paidCount} pending
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Completion</p>
            <div className="flex items-end">
              <p className="text-3xl font-bold text-purple-600">
                {members.length > 0 ? Math.round(paidCount / members.length * 100) : 0}
                %
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-purple-600 h-2 rounded-full transition-all" style={{
              width: `${members.length > 0 ? paidCount / members.length * 100 : 0}%`
            }} />
            </div>
          </div>
        </div>
      </div>
      {/* Payment List */}
      {members.length === 0 ? <div className="bg-white rounded-lg shadow p-12 text-center">
          <DollarSignIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No members yet
          </h3>
          <p className="text-gray-600">
            Add members to start tracking payments
          </p>
        </div> : <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map(member => {
              const paid = hasPaid(member.id);
              return <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-bold text-blue-600">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${club.contributionAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {paid ? <div className="flex items-center text-green-600">
                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                            <span className="text-sm font-medium">Paid</span>
                          </div> : <div className="flex items-center text-red-600">
                            <XCircleIcon className="w-5 h-5 mr-2" />
                            <span className="text-sm font-medium">Pending</span>
                          </div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleMarkPaid(member.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${paid ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {paid ? 'Mark Unpaid' : 'Mark Paid'}
                        </button>
                      </td>
                    </tr>;
            })}
              </tbody>
            </table>
          </div>
        </div>}
    </div>;
}