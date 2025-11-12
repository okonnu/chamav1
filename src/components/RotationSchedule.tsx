import React from 'react';
import { Member, Period, Club } from '../types';
import { CalendarIcon, CheckCircleIcon, ClockIcon, ChevronRightIcon } from 'lucide-react';
interface RotationScheduleProps {
  members: Member[];
  periods: Period[];
  club: Club;
  onPeriodClick: (periodNumber: number) => void;
}
export function RotationSchedule({
  members,
  periods,
  club,
  onPeriodClick
}: RotationScheduleProps) {
  const getRecipientForPeriod = (periodNumber: number) => {
    // Adjust for members who have been pushed back due to missed payments
    const adjustedMembers = [...members].sort((a, b) => {
      const aActualPeriod = a.scheduledPeriod + a.missedPayments;
      const bActualPeriod = b.scheduledPeriod + b.missedPayments;
      return aActualPeriod - bActualPeriod;
    });
    const index = (periodNumber - 1) % members.length;
    return adjustedMembers[index];
  };
  const getPeriodStatus = (periodNumber: number): 'completed' | 'active' | 'upcoming' => {
    if (periodNumber < club.currentPeriod) return 'completed';
    if (periodNumber === club.currentPeriod) return 'active';
    return 'upcoming';
  };
  const totalPeriods = club.totalPeriods || members.length;
  return <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Rotation Schedule</h2>
        <p className="text-sm text-gray-600 mt-1">
          View and manage the complete rotation schedule. Click any period to
          view payment details.
        </p>
      </div>
      {members.length === 0 ? <div className="bg-white rounded-lg shadow p-12 text-center">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No schedule yet
          </h3>
          <p className="text-gray-600">
            Add members to generate the rotation schedule
          </p>
        </div> : <div className="space-y-4">
          {Array.from({
        length: totalPeriods
      }, (_, i) => i + 1).map(periodNumber => {
        const recipient = getRecipientForPeriod(periodNumber);
        const status = getPeriodStatus(periodNumber);
        const expectedAmount = members.length * club.contributionAmount;
        return <button key={periodNumber} onClick={() => onPeriodClick(periodNumber)} className={`w-full bg-white rounded-lg shadow p-6 border-l-4 hover:shadow-lg transition-shadow text-left ${status === 'completed' ? 'border-green-500' : status === 'active' ? 'border-blue-500' : 'border-gray-300'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-green-100' : status === 'active' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <span className={`text-lg font-bold ${status === 'completed' ? 'text-green-600' : status === 'active' ? 'text-blue-600' : 'text-gray-600'}`}>
                        {periodNumber}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Period {periodNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Recipient: {recipient?.name || 'TBD'}
                      </p>
                      {recipient?.email && <p className="text-xs text-gray-500">
                          {recipient.email}
                        </p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Expected Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${expectedAmount}
                      </p>
                      <p className="text-xs text-gray-500">
                        {members.length} × ${club.contributionAmount}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {status === 'completed' && <div className="flex items-center text-green-600">
                          <CheckCircleIcon className="w-6 h-6" />
                        </div>}
                      {status === 'active' && <div className="flex items-center text-blue-600">
                          <ClockIcon className="w-6 h-6" />
                        </div>}
                      {status === 'upcoming' && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                          Upcoming
                        </span>}
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                {status === 'active' && <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-blue-600 font-medium">
                      🔵 Current Period - Click to manage payments
                    </p>
                  </div>}
              </button>;
      })}
        </div>}
      {/* Cycle Information */}
      {members.length > 0 && <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Cycle Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-700 font-medium">Current Cycle</p>
              <p className="text-blue-900 text-xl font-bold">
                {Math.floor((club.currentPeriod - 1) / club.periodsPerCycle) + 1}
              </p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Periods per Cycle</p>
              <p className="text-blue-900 text-xl font-bold">
                {club.periodsPerCycle}
              </p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Total Periods</p>
              <p className="text-blue-900 text-xl font-bold">{totalPeriods}</p>
            </div>
          </div>
        </div>}
    </div>;
}