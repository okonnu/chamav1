import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../utils/supabase';
import { UserPlusIcon, XIcon } from 'lucide-react';
interface JoinRequestFormProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}
export function JoinRequestForm({
  user,
  onClose,
  onSuccess
}: JoinRequestFormProps) {
  const [groupCode, setGroupCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const validateGroupCode = (code: string): boolean => {
    return code.length > 0 && code.trim().length > 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Validate input
      if (!validateGroupCode(groupCode)) {
        setError('Please enter a valid group code');
        setLoading(false);
        return;
      }
      // Check if group exists
      const {
        data: group,
        error: groupError
      } = await supabase.from('groups').select('id').eq('id', groupCode.trim()).single();
      if (groupError || !group) {
        setError('Group not found. Please check the group code and try again.');
        setLoading(false);
        return;
      }
      // Check if user is already a member
      const {
        data: existingMembership
      } = await supabase.from('group_memberships').select('id').eq('group_id', group.id).eq('user_id', user.id).single();
      if (existingMembership) {
        setError('You are already a member of this group');
        setLoading(false);
        return;
      }
      // Check if there's already a pending request
      const {
        data: existingRequest
      } = await supabase.from('join_requests').select('id, status').eq('group_id', group.id).eq('user_id', user.id).eq('status', 'pending').single();
      if (existingRequest) {
        setError('You already have a pending request for this group');
        setLoading(false);
        return;
      }
      // Create join request
      const {
        error: requestError
      } = await supabase.from('join_requests').insert({
        group_id: group.id,
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        message: message.trim() || null,
        status: 'pending'
      });
      if (requestError) {
        throw requestError;
      }
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting join request:', err);
      setError('Failed to submit join request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Request to Join Group
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        {success ? <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-medium">
              Join request submitted successfully!
            </p>
            <p className="text-sm text-green-600 mt-1">
              The group administrator will review your request.
            </p>
          </div> : <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Code *
              </label>
              <input type="text" value={groupCode} onChange={e => setGroupCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter the group code" required disabled={loading} />
              <p className="text-xs text-gray-500 mt-1">
                Ask the group administrator for the group code
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (Optional)
              </label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Introduce yourself or explain why you'd like to join" rows={3} disabled={loading} maxLength={500} />
              <p className="text-xs text-gray-500 mt-1">
                {message.length}/500 characters
              </p>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>}
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading || !groupCode.trim()} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                <UserPlusIcon className="w-5 h-5 mr-2" />
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>}
      </div>
    </div>;
}