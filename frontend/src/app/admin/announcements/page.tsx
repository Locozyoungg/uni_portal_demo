'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Megaphone, Send, Clock, Users, Trash2 } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRole: string;
  priority: string;
  createdAt: string;
}

export default function AdminAnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('STUDENT');
  const [priority, setPriority] = useState('NORMAL');

  const [announcements] = useState<Announcement[]>([
    { id: '1', title: 'Semester Registration Open', content: 'Online registration for the current semester is now open.', targetRole: 'STUDENT', priority: 'HIGH', createdAt: '2026-06-29' },
    { id: '2', title: 'Staff Training Session', content: 'All academic staff are required to attend the new portal training.', targetRole: 'STAFF', priority: 'HIGH', createdAt: '2026-06-28' },
    { id: '3', title: 'Library Extended Hours', content: 'The university library will operate extended hours during exams.', targetRole: 'STUDENT', priority: 'NORMAL', createdAt: '2026-06-27' },
  ]);

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Announcement created successfully');
    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
        <p className="text-muted-foreground">Create and manage announcements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            New Announcement
          </CardTitle>
          <CardDescription>Create a new announcement for students or staff</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <span className="text-sm font-medium">Title *</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
            />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">Content *</span>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm font-medium">Target Audience</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                <option value="STUDENT">Students</option>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Administrators</option>
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium">Priority</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <Button onClick={handleCreate} className="w-full">
            <Send className="mr-2 h-4 w-4" />
            Post Announcement
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Announcements
          </CardTitle>
          <CardDescription>Previously posted announcements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{ann.title}</h4>
                    <Badge variant={ann.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                      {ann.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{ann.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {ann.targetRole}
                    </span>
                    <span>{ann.createdAt}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
