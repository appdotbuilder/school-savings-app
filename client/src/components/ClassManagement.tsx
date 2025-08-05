
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Class as ClassType, CreateClassInput } from '../../../server/src/schema';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  School, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Users,
  Calendar
} from 'lucide-react';

export function ClassManagement() {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadClasses = useCallback(async () => {
    try {
      const allClasses = await trpc.getAllClasses.query();
      setClasses(allClasses);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const filteredClasses = classes.filter((cls: ClassType) =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.academic_year.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClass = async (classId: number) => {
    if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      return;
    }

    try {
      await trpc.deleteClass.mutate({ id: classId });
      await loadClasses();
    } catch (error) {
      console.error('Failed to delete class:', error);
      alert('Failed to delete class. Make sure no students are assigned to this class.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
          <p className="text-gray-600">Manage student classes and academic years</p>
        </div>
        <CreateClassDialog onSuccess={loadClasses} />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search classes by name or academic year..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Classes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <School className="h-5 w-5" />
            <span>All Classes ({filteredClasses.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading classes...</p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <School className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No classes found</p>
              <p className="text-sm text-gray-500">Create your first class to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClasses.map((cls: ClassType) => (
                <div key={cls.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-100 rounded-lg p-2">
                        <School className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                        <Badge variant="outline" className="mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {cls.academic_year}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <EditClassDialog classData={cls} onSuccess={loadClasses} />
                      <Button
                        onClick={() => handleDeleteClass(cls.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {cls.description && (
                    <p className="text-sm text-gray-600 mb-3">{cls.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>Students assigned</span>
                    </div>
                    <span>Created: {cls.created_at.toLocaleDateString('id-ID')}</span>
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

function CreateClassDialog({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateClassInput>({
    name: '',
    description: null,
    academic_year: new Date().getFullYear().toString()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await trpc.createClass.mutate(formData);
      setIsOpen(false);
      setFormData({
        name: '',
        description: null,
        academic_year: new Date().getFullYear().toString()
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create class:', error);
      setError('Failed to create class. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Class</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Class Name *</label>
            <Input
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., VII-A, VIII-B, IX IPA 1"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Academic Year *</label>
            <Input
              value={formData.academic_year}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, academic_year: e.target.value }))
              }
              placeholder="e.g., 2024/2025"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Input
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, description: e.target.value || null }))
              }
              placeholder="Optional class description"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Class'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditClassDialog({ classData, onSuccess }: { classData: ClassType; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: classData.name,
    description: classData.description,
    academic_year: classData.academic_year
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await trpc.updateClass.mutate({
        id: classData.id,
        ...formData,
        description: formData.description || null
      });
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to update class:', error);
      setError('Failed to update class. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Class Name *</label>
            <Input
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Academic Year *</label>
            <Input
              value={formData.academic_year}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, academic_year: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Input
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, description: e.target.value || null }))
              }
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Class'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
