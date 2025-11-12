import React, { useState } from 'react';
import { Club, Member } from '../types';
import { SaveIcon } from 'lucide-react';
interface ClubSettingsProps {
  club: Club;
  setClub: (club: Club) => void;
  members: Member[];
  isAdmin: boolean;
}
export function ClubSettings({
  club,
  setClub,
  members,
  isAdmin
}: ClubSettingsProps) {
  const [formData, setFormData] = useState(club);
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    const updatedClub = {
      ...formData,
      totalPeriods: formData.periodsPerCycle * formData.numberOfCycles
    };
    setClub(updatedClub);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
  return <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Club Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          {isAdmin ? 'Configure your investment club settings' : 'View investment club settings'}
        </p>
      </div>
      {!isAdmin && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            You are viewing this group as a member. Only administrators can
            modify settings.
          </p>
        </div>}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Club Name
            </label>
            <input type="text" value={formData.name} onChange={e => setFormData({
            ...formData,
            name: e.target.value
          })} disabled={!isAdmin} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500" placeholder="My Investment Club" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contribution Amount ($)
            </label>
            <input type="number" value={formData.contributionAmount} onChange={e => setFormData({
            ...formData,
            contributionAmount: Number(e.target.value)
          })} disabled={!isAdmin} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500" placeholder="100" min="1" />
            <p className="text-sm text-gray-500 mt-1">
              Amount each member contributes per period
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contribution Frequency
            </label>
            <select value={formData.frequency} onChange={e => setFormData({
            ...formData,
            frequency: e.target.value as 'weekly' | 'monthly'
          })} disabled={!isAdmin} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periods per Cycle
            </label>
            <input type="number" value={formData.periodsPerCycle} onChange={e => setFormData({
            ...formData,
            periodsPerCycle: Number(e.target.value)
          })} disabled={!isAdmin} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500" min="1" />
            <p className="text-sm text-gray-500 mt-1">
              Number of periods in one complete cycle (typically equals number
              of members)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Cycles
            </label>
            <input type="number" value={formData.numberOfCycles} onChange={e => setFormData({
            ...formData,
            numberOfCycles: Number(e.target.value)
          })} disabled={!isAdmin} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500" min="1" />
            <p className="text-sm text-gray-500 mt-1">
              Number of complete rotation cycles (Total periods ={' '}
              {formData.periodsPerCycle} periods × {formData.numberOfCycles}{' '}
              cycles = {formData.periodsPerCycle * formData.numberOfCycles}{' '}
              periods)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input type="date" value={formData.startDate.split('T')[0]} onChange={e => setFormData({
            ...formData,
            startDate: new Date(e.target.value).toISOString()
          })} disabled={!isAdmin} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500" />
          </div>
          {isAdmin && <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div>
                {saved && <span className="text-sm text-green-600 font-medium">
                    Settings saved successfully!
                  </span>}
              </div>
              <button onClick={handleSave} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <SaveIcon className="w-5 h-5 mr-2" />
                Save Changes
              </button>
            </div>}
        </div>
      </div>
      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          About ROSCA
        </h3>
        <p className="text-sm text-blue-800 leading-relaxed">
          A Rotating Savings and Credit Association (ROSCA) is a trust-based
          system where members contribute a fixed amount regularly. Each period,
          the total pot goes to one member in rotation. This continues until
          everyone has received the pot once, completing a full cycle. No
          interest is charged, making it ideal for community savings and helping
          members access lump sums for business, education, or other needs.
        </p>
      </div>
    </div>;
}