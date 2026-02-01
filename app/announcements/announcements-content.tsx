'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MessageSquare,
  Plus,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  User,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { announcementsApi } from '@/lib/api';
import { Announcement } from '@/types';
import { toast } from 'sonner';

export function AnnouncementsContent() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string>('medium');
  const [targetAudience, setTargetAudience] = useState({
    students: true,
    parents: true,
    staff: true,
    management: true,
  });

  // Form state for creating announcements
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const data = await announcementsApi.getList();
        setAnnouncements(data);
      } catch (error) {
        toast.error('Failed to load announcements');
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await announcementsApi.create({
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        priority: selectedPriority,
        for_students: targetAudience.students,
        for_parents: targetAudience.parents,
        for_staff: targetAudience.staff,
        for_management: targetAudience.management,
      });

      toast.success('Announcement created successfully!');
      setShowCreateDialog(false);
      setNewAnnouncement({ title: '', content: '' });
      // Reset target audience to defaults
      setTargetAudience({
        students: true,
        parents: true,
        staff: true,
        management: true,
      });
      // Refresh announcements
      const data = await announcementsApi.getList();
      setAnnouncements(data);
    } catch (error) {
      toast.error('Failed to create announcement');
      console.error('Error creating announcement:', error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'default';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading announcements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Stay updated with the latest school news and important notices
          </p>
        </div>
        {(user?.role === 'management' || user?.role === 'admin') && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Share important news and updates with the school community
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Announcement title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    placeholder="Announcement content..."
                    rows={4}
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Target Audience</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="students"
                        checked={targetAudience.students}
                        onCheckedChange={(checked) =>
                          setTargetAudience(prev => ({ ...prev, students: checked as boolean }))
                        }
                      />
                      <label htmlFor="students" className="text-sm">Students</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="parents"
                        checked={targetAudience.parents}
                        onCheckedChange={(checked) =>
                          setTargetAudience(prev => ({ ...prev, parents: checked as boolean }))
                        }
                      />
                      <label htmlFor="parents" className="text-sm">Parents</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="staff"
                        checked={targetAudience.staff}
                        onCheckedChange={(checked) =>
                          setTargetAudience(prev => ({ ...prev, staff: checked as boolean }))
                        }
                      />
                      <label htmlFor="staff" className="text-sm">Staff</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="management"
                        checked={targetAudience.management}
                        onCheckedChange={(checked) =>
                          setTargetAudience(prev => ({ ...prev, management: checked as boolean }))
                        }
                      />
                      <label htmlFor="management" className="text-sm">Management</label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateAnnouncement} className="flex-1">
                    Create Announcement
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getPriorityIcon(announcement.priority)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{announcement.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{announcement.createdBy}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={getPriorityColor(announcement.priority)}>
                    {announcement.priority.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Announcements</h3>
                <p className="text-muted-foreground">
                  There are no announcements at the moment. Check back later for updates.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}