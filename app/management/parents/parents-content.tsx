'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  User,
  Heart,
  Calendar
} from 'lucide-react';
import { usersApi } from '@/lib/api';
import { Parent } from '@/types';
import { toast } from 'sonner';

export function ParentsManagementContent() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchParents = async () => {
      try {
        setLoading(true);
        const parentsData = await usersApi.getParents();
        setParents(parentsData);
      } catch (error) {
        toast.error('Failed to load parents data');
        console.error('Error fetching parents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParents();
  }, []);

  // Filter parents based on search
  const filteredParents = parents.filter(parent => {
    const matchesSearch = parent.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         parent.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         parent.parentId.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading parents...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Parents Management</h1>
          <p className="text-muted-foreground">
            Manage parent accounts and their children relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Parent
          </Button>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parents.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered parents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parents.reduce((sum, parent) => sum + (parent.childrenCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Children enrolled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Children/Parent</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parents.length > 0 ? (parents.reduce((sum, parent) => sum + (parent.childrenCount || 0), 0) / parents.length).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Children per parent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Parents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parents.length}</div>
            <p className="text-xs text-muted-foreground">
              With active accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search Parents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or parent ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredParents.map((parent) => (
          <Card key={parent.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={parent.user.avatar} />
                  <AvatarFallback>
                    {parent.user.firstName[0]}{parent.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {parent.user.firstName} {parent.user.lastName}
                  </CardTitle>
                  <Badge variant="outline" className="mt-1">
                    Parent
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Parent ID</p>
                  <p className="font-medium">{parent.parentId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Children</p>
                  <p className="font-medium">{parent.childrenCount || 0}</p>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{parent.user.email}</p>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{parent.user.phone || 'Not provided'}</p>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredParents.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Parents Found</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Try adjusting your search terms.'
                  : 'No parents are currently registered.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}