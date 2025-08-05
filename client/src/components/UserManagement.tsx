
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { User, CreateStudentInput, CreateStaffInput, Class as ClassType } from '../../../server/src/schema';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Plus, 
  Search, 
  RotateCcw,
  UserCheck,
  UserX,
  GraduationCap,
  UserCog
} from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await trpc.getAllUsers.query();
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return 'bg-purple-100 text-purple-800';
      case 'STAFF':
        return 'bg-blue-100 text-blue-800';
      case 'STUDENT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return <UserCog className="h-4 w-4" />;
      case 'STAFF':
        return <Users className="h-4 w-4" />;
      case 'STUDENT':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      await trpc.toggleUserStatus.mutate({ userId });
      await loadUsers(); // Refresh the list
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage staff and student accounts</p>
        </div>
        <div className="flex space-x-2">
          <CreateUserDialog onSuccess={loadUsers} />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or username..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMINISTRATOR">Administrator</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>All Users ({filteredUsers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user: User) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{user.full_name}</p>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role.toLowerCase()}
                        </Badge>
                        {!user.is_active && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                        {user.must_change_password && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Must Change Password
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      {user.email && (
                        <p className="text-sm text-gray-500">{user.email}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleToggleUserStatus(user.id)}
                      variant="outline"
                      size="sm"
                      className={user.is_active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                    >
                      {user.is_active ? (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <ResetPasswordDialog userId={user.id} userName={user.full_name} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateUserDialog({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [userType, setUserType] = useState<'staff' | 'student'>('staff');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        
        <Tabs value={userType} onValueChange={(value) => setUserType(value as 'staff' | 'student')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="staff">Staff Member</TabsTrigger>
            <TabsTrigger value="student">Student</TabsTrigger>
          </TabsList>
          
          <TabsContent value="staff" className="mt-4">
            <CreateStaffForm onSuccess={() => { setIsOpen(false); onSuccess(); }} />
          </TabsContent>
          
          <TabsContent value="student" className="mt-4">
            <CreateStudentForm onSuccess={() => { setIsOpen(false); onSuccess(); }} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CreateStaffForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState<CreateStaffInput>({
    username: '',
    full_name: '',
    employee_id: '',
    department: null,
    position: null,
    email: null,
    phone: null,
    password: undefined
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await trpc.createStaff.mutate(formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create staff:', error);
      setError('Failed to create staff member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Username *</label>
          <Input
            value={formData.username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, username: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Employee ID *</label>
          <Input
            value={formData.employee_id}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, employee_id: e.target.value }))
            }
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Full Name *</label>
        <Input
          value={formData.full_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, full_name: e.target.value }))
          }
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Department</label>
          <Input
            value={formData.department || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, department: e.target.value || null }))
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Position</label>
          <Input
            value={formData.position || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, position: e.target.value || null }))
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <Input
            type="email"
            value={formData.email || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, email: e.target.value || null }))
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <Input
            value={formData.phone || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, phone: e.target.value || null }))
            }
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Initial Password</label>
        <Input
          type="password"
          value={formData.password || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, password: e.target.value || undefined }))
          }
          placeholder="Leave empty for auto-generated password"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create Staff Member'}
      </Button>
    </form>
  );
}

function CreateStudentForm({ onSuccess }: { onSuccess: () => void }) {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [formData, setFormData] = useState<CreateStudentInput>({
    full_name: '',
    nis: '',
    class_id: 0,
    parent_name: null,
    parent_phone: null,
    address: null,
    email: null,
    phone: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const allClasses = await trpc.getAllClasses.query();
        setClasses(allClasses);
      } catch (error) {
        console.error('Failed to load classes:', error);
      }
    };
    loadClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await trpc.createStudent.mutate(formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create student:', error);
      setError('Failed to create student. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Full Name *</label>
          <Input
            value={formData.full_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, full_name: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">NIS (Student Number) *</label>
          <Input
            value={formData.nis}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, nis: e.target.value }))
            }
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Class *</label>
        <Select value={formData.class_id.toString()} onValueChange={(value) => 
          setFormData(prev => ({ ...prev, class_id: parseInt(value) }))
        }>
          <SelectTrigger>
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id.toString()}>
                {cls.name} - {cls.academic_year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Parent Name</label>
          <Input
            value={formData.parent_name || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, parent_name: e.target.value || null }))
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Parent Phone</label>
          <Input
            value={formData.parent_phone || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, parent_phone: e.target.value || null }))
            }
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Address</label>
        <Input
          value={formData.address || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, address: e.target.value || null }))
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <Input
            type="email"
            value={formData.email || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, email: e.target.value || null }))
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <Input
            value={formData.phone || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, phone: e.target.value || null }))
            }
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create Student'}
      </Button>
    </form>
  );
}

function ResetPasswordDialog({ userId, userName }: { userId: number; userName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await trpc.resetPassword.mutate({ user_id: userId, new_password: newPassword });
      setIsOpen(false);
      setNewPassword('');
    } catch (error) {
      console.error('Failed to reset password:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset Password
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password for {userName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
