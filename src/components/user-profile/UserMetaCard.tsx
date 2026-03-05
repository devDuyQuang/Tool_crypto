"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { toast } from "react-toastify";
import type { MeResult } from "@/types/me";
import { updateMeProfile, updateMeSocial } from "@/services/profile.api";

type Props = {
  me: MeResult;
  onUpdated?: (next: MeResult) => void; // để page profile setMe()
};

export default function UserMetaCard({ me, onUpdated }: Props) {
  const { isOpen, openModal, closeModal } = useModal();

  const [saving, setSaving] = useState(false);

  // ✅ tách fullName thành first/last để show input (demo TailAdmin)
  const { firstNameInit, lastNameInit } = useMemo(() => {
    const parts = (me.fullName || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return { firstNameInit: parts[0] || "", lastNameInit: "" };
    return { firstNameInit: parts.slice(0, -1).join(" "), lastNameInit: parts.slice(-1).join(" ") };
  }, [me.fullName]);

  // form state
  const [facebook, setFacebook] = useState(me.social?.facebook || "");
  const [x, setX] = useState(me.social?.x || "");
  const [linkedin, setLinkedin] = useState(me.social?.linkedin || "");
  const [instagram, setInstagram] = useState(me.social?.instagram || "");

  const [firstName, setFirstName] = useState(firstNameInit);
  const [lastName, setLastName] = useState(lastNameInit);
  const [email, setEmail] = useState(me.email || "");
  const [phone, setPhone] = useState(me.phone || "");
  const [bio, setBio] = useState(me.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl || "");

  const open = () => {
    // ✅ reset form mỗi lần mở modal theo data mới nhất
    setFacebook(me.social?.facebook || "");
    setX(me.social?.x || "");
    setLinkedin(me.social?.linkedin || "");
    setInstagram(me.social?.instagram || "");

    setFirstName(firstNameInit);
    setLastName(lastNameInit);
    setEmail(me.email || "");
    setPhone(me.phone || "");
    setBio(me.bio || "");
    setAvatarUrl(me.avatarUrl || "");

    openModal();
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setSaving(true);

      const fullName = [firstName, lastName].map((s) => s.trim()).filter(Boolean).join(" ");

      // ✅ Update profile + social (nếu BE chưa có endpoint thì comment 2 đoạn dưới)
      const [profileRes, socialRes] = await Promise.allSettled([
        updateMeProfile({
          fullName,
          email,
          phone,
          bio,
          avatarUrl: avatarUrl || null,
        }),
        updateMeSocial({
          facebook: facebook || null,
          x: x || null,
          linkedin: linkedin || null,
          instagram: instagram || null,
        }),
      ]);

      // merge data (ưu tiên cái fulfilled)
      let next: MeResult = { ...me };

      if (profileRes.status === "fulfilled") next = { ...next, ...profileRes.value };
      if (socialRes.status === "fulfilled") next = { ...next, ...socialRes.value };

      onUpdated?.(next);

      toast.success("Saved ✅");
      closeModal();
    } catch (err: any) {
      toast.error(err?.message || "Save failed ❌");
    } finally {
      setSaving(false);
    }
  };

  const displayName = me.fullName || "(No name)";
  const displayRole = me.role || "user";

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              {me.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.avatarUrl} alt="avatar" className="w-20 h-20 object-cover" />
              ) : (
                <span className="text-gray-500 dark:text-gray-400 text-lg">?</span>
              )}
            </div>

            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {displayName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">{displayRole}</p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{me.email}</p>
              </div>
            </div>

            {/* ✅ Social icon chỉ hiện nếu có link */}
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              {me.social?.facebook && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={me.social.facebook}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <span className="text-sm font-semibold">f</span>
                </a>
              )}

              {me.social?.x && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={me.social.x}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <span className="text-sm font-semibold">X</span>
                </a>
              )}

              {me.social?.linkedin && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={me.social.linkedin}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <span className="text-sm font-semibold">in</span>
                </a>
              )}

              {me.social?.instagram && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={me.social.instagram}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <span className="text-sm font-semibold">ig</span>
                </a>
              )}
            </div>
          </div>

          <button
            onClick={open}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            Edit
          </button>
        </div>
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
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Social Links
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Facebook</Label>
                    <Input type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
                  </div>

                  <div>
                    <Label>X.com</Label>
                    <Input type="text" value={x} onChange={(e) => setX(e.target.value)} />
                  </div>

                  <div>
                    <Label>Linkedin</Label>
                    <Input type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                  </div>

                  <div>
                    <Label>Instagram</Label>
                    <Input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Avatar URL</Label>
                    <Input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Bio</Label>
                    <Input type="text" value={bio} onChange={(e) => setBio(e.target.value)} />
                  </div>
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
    </>
  );
}