"use client";

import React from "react";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { useAuth } from "@/context/AuthContext";

export default function Profile() {
  const { me, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!me)
    return (
      <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600">
        No access token / Not logged in
      </div>
    );

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>

        <div className="space-y-6">
          <UserMetaCard me={me} onUpdated={() => { }} />
          <UserInfoCard me={me} onUpdated={() => { }} />
          <UserAddressCard me={me} onUpdated={() => { }} />
        </div>
      </div>
    </div>
  );
}