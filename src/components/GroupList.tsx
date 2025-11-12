import React, { useState } from "react";
import { Group, User } from "../types";
import {
  PlusIcon,
  UsersIcon,
  ChevronRightIcon,
  LogOutIcon,
  CrownIcon,
  UserPlusIcon,
} from "lucide-react";
import { JoinRequestForm } from "./JoinRequestForm";
interface GroupListProps {
  user: User;
  groups: Group[];
  onSelectGroup: (group: Group) => void;
  onCreateGroup: (groupName: string, description: string) => void;
  onLogout: () => void;
  onRefresh: () => void;
}
export function GroupList({
  user,
  groups,
  onSelectGroup,
  onCreateGroup,
  onLogout,
  onRefresh,
}: GroupListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const handleCreateGroup = () => {
    if (!newGroupName) return;
    onCreateGroup(newGroupName, newGroupDescription);
    setNewGroupName("");
    setNewGroupDescription("");
    setShowCreateModal(false);
  };
  const getUserRole = (group: Group): "admin" | "member" => {
    const membership = group.memberships.find((m) => m.userId === user.id);
    return membership?.role || "member";
  };
  const adminGroups = groups.filter((g) => getUserRole(g) === "admin");
  const memberGroups = groups.filter((g) => getUserRole(g) === "member");
  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Welcome, {user.name}
              </h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOutIcon className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Groups</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a group to manage or create a new one
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UserPlusIcon className="w-5 h-5 mr-2" />
              Join Group
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Group
            </button>
          </div>
        </div>
        {groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No groups yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first investment group or join an existing one
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Join a Group
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Group
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Admin Groups */}
            {adminGroups.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CrownIcon className="w-5 h-5 mr-2 text-yellow-500" />
                  Groups You Administer
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adminGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => onSelectGroup(group)}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-left"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <CrownIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {group.name}
                      </h4>
                      {group.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {group.members.length} members
                        </span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Admin
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Member Groups */}
            {memberGroups.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UsersIcon className="w-5 h-5 mr-2 text-blue-500" />
                  Groups You Belong To
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {memberGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => onSelectGroup(group)}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-left"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <UsersIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {group.name}
                      </h4>
                      {group.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {group.members.length} members
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Member
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Create New Group
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Family Investment Club"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="A brief description of your group"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Join Request Modal */}
      {showJoinModal && (
        <JoinRequestForm
          user={user}
          onClose={() => setShowJoinModal(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}
