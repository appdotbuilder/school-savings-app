
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { StudentProfile, User as UserType, Class as ClassType } from '../../../server/src/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  User, 
  DollarSign,
  GraduationCap,
  Eye
} from 'lucide-react';

// Define the extended type for students with user and class data
type StudentWithDetails = StudentProfile & { 
  user: UserType; 
  class: { name: string } 
};

export function StudentList() {
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      const [allStudents, allClasses] = await Promise.all([
        trpc.getAllStudents.query(),
        trpc.getAllClasses.query()
      ]);
      setStudents(allStudents);
      setClasses(allClasses);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredStudents = students.filter((student: StudentWithDetails) => {
    const matchesSearch = student.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.nis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || student.class_id.toString() === classFilter;
    return matchesSearch && matchesClass;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getBalanceColor = (balance: number) => {
    if (balance >= 100000) return 'bg-green-100 text-green-800';
    if (balance >= 50000) return 'bg-blue-100 text-blue-800';
    if (balance >= 10000) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students by name or NIS..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id.toString()}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Students Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading students...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-8">
          <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No students found</p>
          <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student: StudentWithDetails) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {student.user.full_name}
                      </h3>
                      <p className="text-xs text-gray-600">NIS: {student.nis}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Current Balance:</span>
                    <Badge className={getBalanceColor(student.current_balance)}>
                      {formatCurrency(student.current_balance)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Class:</span>
                    <Badge variant="outline" className="text-xs">
                      {student.class.name}
                    </Badge>
                  </div>

                  {student.parent_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Parent:</span>
                      <span className="text-xs text-gray-800">{student.parent_name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Member since: {student.created_at.toLocaleDateString('id-ID')}
                  </span>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!isLoading && filteredStudents.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">{filteredStudents.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Savings</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(
                    filteredStudents.reduce((sum: number, student: StudentWithDetails) => 
                      sum + student.current_balance, 0
                    )
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Balance</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(
                    filteredStudents.reduce((sum: number, student: StudentWithDetails) => 
                      sum + student.current_balance, 0
                    ) / filteredStudents.length
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Highest Balance</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(
                    Math.max(...filteredStudents.map((student: StudentWithDetails) => student.current_balance))
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
