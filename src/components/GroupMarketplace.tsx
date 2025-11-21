import { useState, useEffect } from "react";
import { User } from "../types";
import { supabase } from "../utils/supabase";
import {
  SearchIcon,
  UsersIcon,
  DollarSignIcon,
  CalendarIcon,
  CheckCircleIcon,
  XIcon,
} from "lucide-react";

interface GroupMarketplaceProps {
  user: User;
  onSuccess: () => void;
}

interface AvailableGroup {
  id: string;
  name: string;
  description?: string;
  club: {
    name: string;
    contributionAmount: number;
    frequency: "weekly" | "monthly";
    currentPeriod: number;
    totalPeriods: number;
  };
  memberCount: number;
}

export function GroupMarketplace({ user, onSuccess }: GroupMarketplaceProps) {
  const [groups, setGroups] = useState<AvailableGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<AvailableGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<AvailableGroup | null>(
    null
  );
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch all available groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError("");

        if (!supabase) {
          setError("Database not configured");
          setLoading(false);
          return;
        }

        // Get all groups
        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("*");

        if (groupsError) throw groupsError;
        if (!groupsData) {
          setGroups([]);
          return;
        }

        // Get user's current memberships to exclude groups they're already in
        const { data: userMemberships } = await supabase
          .from("group_memberships")
          .select("group_id")
          .eq("user_id", user.id);

        const userGroupIds = userMemberships?.map((m) => m.group_id) || [];

        // Get member counts for each group and filter
        const availableGroups = await Promise.all(
          groupsData
            .filter((g) => !userGroupIds.includes(g.id)) // Exclude groups user is already in
            .map(async (g) => {
              if (!supabase) return null;
              const { count } = await supabase
                .from("members")
                .select("*", { count: "exact", head: true })
                .eq("group_id", g.id);

              return {
                id: g.id,
                name: g.name,
                description: g.description || undefined,
                club: {
                  name: g.club_name,
                  contributionAmount: g.contribution_amount,
                  frequency: g.frequency as "weekly" | "monthly",
                  currentPeriod: g.current_period,
                  totalPeriods: g.total_periods,
                },
                memberCount: count || 0,
              };
            })
        );

        setGroups(
          availableGroups.filter((g) => g !== null) as AvailableGroup[]
        );
        setFilteredGroups(
          availableGroups.filter((g) => g !== null) as AvailableGroup[]
        );
      } catch (err) {
        console.error("Error fetching groups:", err);
        setError("Failed to load available groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user.id]);

  // Filter groups based on search term
  useEffect(() => {
    const filtered = groups.filter(
      (g) =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.description &&
          g.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        g.club.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredGroups(filtered);
  }, [searchTerm, groups]);

  const handleJoinClick = (group: AvailableGroup) => {
    setSelectedGroup(group);
    setJoinMessage("");
    setError("");
  };

  const handleSubmitJoinRequest = async () => {
    if (!selectedGroup) return;

    try {
      setError("");
      setJoiningGroupId(selectedGroup.id);

      if (!supabase) {
        setError("Database not configured");
        setJoiningGroupId(null);
        return;
      }

      // Check if there's already a pending request
      const { data: existingRequest } = await supabase
        .from("join_requests")
        .select("id, status")
        .eq("group_id", selectedGroup.id)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .single();

      if (existingRequest) {
        setError("You already have a pending request for this group");
        setJoiningGroupId(null);
        return;
      }

      // Create join request
      const { error: requestError } = await supabase
        .from("join_requests")
        .insert({
          group_id: selectedGroup.id,
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          message: joinMessage.trim() || null,
          status: "pending",
        });

      if (requestError) throw requestError;

      setSuccessMessage(`Join request sent to ${selectedGroup.name}!`);
      setTimeout(() => {
        setSelectedGroup(null);
        setJoinMessage("");
        setSearchTerm("");
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error("Error submitting join request:", err);
      setError("Failed to submit join request. Please try again.");
    } finally {
      setJoiningGroupId(null);
    }
  };

  return (
    <div className="mt-12">
      {/* Section Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Discover Groups</h3>
        <p className="text-sm text-gray-600 mt-1">
          Browse and join investment groups
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups by name, description, or club name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 text-blue-600 animate-spin border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="ml-2 text-gray-600">Loading groups...</span>
        </div>
      )}

      {/* Error State */}
      {error && !selectedGroup && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Groups Grid */}
      {!loading && filteredGroups.length > 0 && !selectedGroup && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-all p-6 border border-gray-200 hover:border-blue-400"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {group.name}
                  </h4>
                  {group.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {group.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <UsersIcon className="w-4 h-4 mr-2 text-blue-500" />
                  <span>{group.memberCount} members</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSignIcon className="w-4 h-4 mr-2 text-green-500" />
                  <span>
                    {group.club.contributionAmount.toLocaleString()} KES
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4 mr-2 text-purple-500" />
                  <span className="capitalize">{group.club.frequency}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {group.club.currentPeriod}/{group.club.totalPeriods}
                  </span>
                  <span> periods</span>
                </div>
              </div>

              <button
                onClick={() => handleJoinClick(group)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Join Group
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredGroups.length === 0 && !selectedGroup && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {groups.length === 0
              ? "No groups available"
              : "No groups match your search"}
          </h4>
          <p className="text-gray-600">
            {groups.length === 0
              ? "Check back later for new investment groups"
              : "Try adjusting your search criteria"}
          </p>
        </div>
      )}

      {/* Join Request Panel */}
      {selectedGroup && (
        <div className="bg-white rounded-lg shadow-lg border border-blue-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Join {selectedGroup.name}
              </h3>
              <p className="text-gray-600">
                Review the group details and submit your join request
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedGroup(null);
                setJoinMessage("");
                setError("");
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Club Name:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedGroup.club.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Contribution Amount:
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedGroup.club.contributionAmount.toLocaleString()} KES
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Frequency:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {selectedGroup.club.frequency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Members:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedGroup.memberCount}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Period Info</h4>
              <p className="text-gray-600 mb-2">
                <span className="font-medium text-2xl text-blue-600">
                  {selectedGroup.club.currentPeriod}
                </span>
                <span className="text-gray-600">
                  {" "}
                  of {selectedGroup.club.totalPeriods} periods
                </span>
              </p>
              <p className="text-xs text-gray-600">
                Current period progress in the group's cycle
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message to Administrator (Optional)
            </label>
            <textarea
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              placeholder="Introduce yourself or explain why you'd like to join..."
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={joiningGroupId !== null}
            />
            <p className="text-xs text-gray-500 mt-1">
              {joinMessage.length}/500 characters
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setSelectedGroup(null);
                setJoinMessage("");
                setError("");
              }}
              disabled={joiningGroupId !== null}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitJoinRequest}
              disabled={joiningGroupId !== null}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {joiningGroupId === selectedGroup.id ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Sending...
                </>
              ) : (
                "Send Join Request"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
