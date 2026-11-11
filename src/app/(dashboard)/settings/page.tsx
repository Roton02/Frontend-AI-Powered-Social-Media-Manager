"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Globe,
  Lock,
  Loader2
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox as Switch } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import type { Workspace, AuthUser } from "@/lib/types";

export default function SettingsPage() {
  const { user, setSession } = useAuth();
  const { workspace, updateSettings } = useWorkspace();
  const [isLoading, setLoading] = useState(false);

  // Local state for forms to avoid premature updates
  const [profileForm, setProfileForm] = useState<Partial<AuthUser>>({});
  const [workspaceForm, setWorkspaceForm] = useState<Partial<Workspace>>({});

  useEffect(() => {
    if (user) setProfileForm(user);
    if (workspace) setWorkspaceForm(workspace);
  }, [user, workspace]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // We use the /auth/set-profile endpoint
      const updatedUser = await api.put<AuthUser>("/auth/set-profile", profileForm);
      setSession(updatedUser);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkspace = async () => {
    setLoading(true);
    try {
      // We use the /workspace endpoint with { settings } payload
      const updatedWorkspace = await api.patch<Workspace>("/workspace", {
        name: workspaceForm.name,
        slug: workspaceForm.slug,
        settings: workspaceForm.settings || {},
      }, { workspace: true });

      // updateSettings from WorkspaceProvider handles the context update
      await updateSettings(updatedWorkspace.settings || {});
      toast.success("Workspace settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save workspace settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="text-sm text-slate-500">
            Manage your account and workspace preferences.
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User size={20} className="text-slate-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="userName">Full Name</Label>
                  <Input
                    id="userName"
                    value={profileForm.userName || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, userName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileForm.phone || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profileForm.address || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <SettingsIcon size={20} className="text-slate-600" />
                Workspace Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="workspaceName">Workspace Name</Label>
                <Input
                  id="workspaceName"
                  value={workspaceForm.name || ""}
                  onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="workspaceSlug">Workspace Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">pitret.saas/</span>
                  <Input
                    id="workspaceSlug"
                    value={workspaceForm.slug || ""}
                    onChange={(e) => setWorkspaceForm({ ...workspaceForm, slug: e.target.value })}
                    className="border-l-0 rounded-l-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveWorkspace}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Save Workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Bell size={20} className="text-slate-600" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-slate-500 italic">
                Notification preferences are currently handled by the system default.
              </p>
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 opacity-50">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-xs text-slate-500">
                    Receive email updates for new messages and system alerts
                  </p>
                </div>
                <Switch defaultChecked disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
