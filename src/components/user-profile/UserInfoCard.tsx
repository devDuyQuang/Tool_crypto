"use client";

import React, { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { toast } from "react-toastify";
import type { MeResult } from "@/types/me";
import { updateMeProfile } from "@/services/profile.api";

type Props = {
  me: MeResult;
  onUpdated?: (next: MeResult) => void;
};

export default function UserInfoCard({ me, onUpdated }: Props) {
  const { isOpen, openModal, closeModal } = useModal();
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(me.fullName || "");
  const [email, setEmail] = useState(me.email || "");
  const [role, setRole] = useState(me.role || "user");
  const [phone, setPhone] = useState(me.phone || "");
  const [bio, setBio] = useState(me.bio || "");

  useEffect(() => {
    setFullName(me.fullName || "");
    setEmail(me.email || "");
    setRole(me.role || "user");
    setPhone(me.phone || "");
    setBio(me.bio || "");
  }, [me]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setSaving(true);

      const updated = await updateMeProfile({
        fullName,
        email,
        phone,
        bio,
      });

      const next = { ...me, ...updated } as MeResult;
      onUpdated?.(next);

      toast.success("Saved ✅");
      closeModal();
    } catch (err: any) {
      toast.error(err?.message || "Save failed ❌");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Full Name</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{me.fullName || "-"}</p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Email address</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{me.email}</p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{me.role}</p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {me.isActive ? "true" : "false"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{me.phone || "-"}</p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Bio</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{me.bio || "-"}</p>
            </div>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          Edit
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>

          <form className="flex flex-col" onSubmit={handleSave}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2">
                  <Label>Full Name</Label>
                  <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Email Address</Label>
                  <Input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Role</Label>
                  <Input type="text" value={role} disabled />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Phone</Label>
                  <Input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Bio</Label>
                  <Input type="text" value={bio} onChange={(e) => setBio(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>

              <Button
                size="sm"
                disabled={saving}
                onClick={() => handleSave()}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}