"use client";

import React, { useState, useEffect } from "react";
import { Save, User, Lock, Mail, Phone, MapPin, Camera, Globe, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, setSession } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Partial<AuthUser>>({});

  useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await api.put<AuthUser>("/auth/set-profile", form);
      setSession(updatedUser);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Profile</h1>
          <p className="text-slate-500">Manage your account settings and personal preferences.</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 gap-2"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} className="text-slate-400" />
                  )}
                </div>
                <Button variant="secondary" size="icon" className="absolute bottom-0 right-0 rounded-full bg-white border shadow-sm hover:bg-slate-50">
                  <Camera size={16} />
                </Button>
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">{user?.userName || "User Name"}</h2>
                <p className="text-sm text-slate-500">Workspace Member</p>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs">
                {user?.role || "Client"} Plan
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Role:</span>
                <span className="font-medium text-slate-700">{user?.role || "N/A"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Status:</span>
                <span className="font-medium text-slate-700">{user?.status || "Active"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} className="text-slate-400" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={form.userName || ""}
                    onChange={(e) => setForm({ ...form, userName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={form.email || ""}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    value={form.phone || ""}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website/Portfolio</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input className="pl-10" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pending, setPending] = useState(false);

  const handleChange = async () => {
    if (!current || !next) {
      toast.error("Fill in current and new password");
      return;
    }
    if (next !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    setPending(true);
    try {
      await api.patch("/auth/change-password", { oldPassword: current, newPassword: next });
      toast.success("Password changed successfully");
      setCurrent("");
      setNext("");
      setConfirmPw("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock size={20} className="text-slate-400" />
          Security Settings
        </CardTitle>
        <CardDescription>Update your password and security preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Current Password</Label>
          <Input type="password" placeholder="••••••••" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" placeholder="••••••••" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" placeholder="••••••••" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleChange}
          disabled={pending}
        >
          {pending ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
          Change Password
        </Button>
      </CardContent>
    </Card>
  );
}

function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: string }) {
  return <span className={cn("px-2 py-0.5 rounded-full text-center", className)}>{children}</span>;
}
