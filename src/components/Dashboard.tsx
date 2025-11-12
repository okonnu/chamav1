import React from "react";
import { Club, Member, Payment, Period } from "../types";
import {
  UsersIcon,
  DollarSignIcon,
  CalendarIcon,
  TrendingUpIcon,
} from "lucide-react";
interface DashboardProps {
  club: Club;
  members: Member[];
  payments: Payment[];
  periods: Period[];
}
export function Dashboard({
  club,
  members,
  payments,
  periods,
}: DashboardProps) {
  const currentPeriod = periods.find((p) => p.status === "active");
  const currentRecipient = currentPeriod
    ? members.find((m) => m.id === currentPeriod.recipientId)
    : null;
  const currentPeriodPayments = payments.filter(
    (p) => p.period === club.currentPeriod
  );
  const totalCollected = currentPeriodPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );
  const expectedTotal = members.length * club.contributionAmount;
  const stats = [
    {
      label: "Total Members",
      value: members.length,
      icon: UsersIcon,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Contribution Amount",
      value: `$${club.contributionAmount}`,
      icon: DollarSignIcon,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Current Period",
      value: `${club.currentPeriod} of ${club.totalPeriods}`,
      icon: CalendarIcon,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Total Pot",
      value: `$${expectedTotal}`,
      icon: TrendingUpIcon,
      color: "bg-orange-100 text-orange-600",
    },
  ];
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Current Period Info */}
      {currentRecipient && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Current Period
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recipient</p>
              <p className="text-xl font-bold text-gray-900">
                {currentRecipient.name}
              </p>
              <p className="text-sm text-gray-500">{currentRecipient.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Collected</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalCollected}
              </p>
              <p className="text-sm text-gray-500">of ${expectedTotal}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(totalCollected / expectedTotal) * 100}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {currentPeriodPayments.length} of {members.length} members paid
            </p>
          </div>
        </div>
      )}
      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Club Information
          </h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Frequency</dt>
              <dd className="text-sm font-medium text-gray-900 capitalize">
                {club.frequency}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Started</dt>
              <dd className="text-sm font-medium text-gray-900">
                {new Date(club.startDate).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Current Cycle</dt>
              <dd className="text-sm font-medium text-gray-900">
                {Math.floor((club.currentPeriod - 1) / club.periodsPerCycle) +
                  1}{" "}
                of {club.numberOfCycles}
              </dd>
            </div>
          </dl>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-500">No payments yet</p>
          ) : (
            <div className="space-y-3">
              {payments
                .slice(-5)
                .reverse()
                .map((payment) => {
                  const member = members.find((m) => m.id === payment.memberId);
                  return (
                    <div
                      key={`${payment.memberId}-${payment.date}`}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        +${payment.amount}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
