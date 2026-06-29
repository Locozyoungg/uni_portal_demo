'use client';

import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { toast } from 'sonner';
import { User, Bell, Shield, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  const studentName = user?.student
    ? `${user.student.firstName} ${user.student.lastName}`
    : 'N/A';

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <span className="text-sm font-medium">Display Name</span>
            <Input value={studentName} disabled />
            <p className="text-xs text-muted-foreground">
              Name managed by university registry
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">Admission Number</span>
            <Input value={user?.username || 'N/A'} disabled />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">Email</span>
            <Input value={user?.email || 'N/A'} disabled />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">Role</span>
            <Input value={user?.role || 'N/A'} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox id="email-notify" defaultChecked />
            <div>
              <label htmlFor="email-notify" className="text-sm font-medium cursor-pointer">
                Email Notifications
              </label>
              <p className="text-xs text-muted-foreground">Receive notifications via email</p>
            </div>
          </div>
          <hr className="border-gray-200 dark:border-gray-800" />
          <div className="flex items-center gap-3">
            <Checkbox id="push-notify" defaultChecked />
            <div>
              <label htmlFor="push-notify" className="text-sm font-medium cursor-pointer">
                Push Notifications
              </label>
              <p className="text-xs text-muted-foreground">Receive push notifications in browser</p>
            </div>
          </div>
          <hr className="border-gray-200 dark:border-gray-800" />
          <div className="flex items-center gap-3">
            <Checkbox id="sms-notify" />
            <div>
              <label htmlFor="sms-notify" className="text-sm font-medium cursor-pointer">
                SMS Notifications
              </label>
              <p className="text-xs text-muted-foreground">Receive notifications via SMS</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the portal appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox id="dark-mode" />
            <div>
              <label htmlFor="dark-mode" className="text-sm font-medium cursor-pointer">
                Dark Mode
              </label>
              <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Account security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => toast.info('Password change feature coming soon')}
          >
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
