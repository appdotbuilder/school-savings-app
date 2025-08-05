
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { User, DashboardStats } from '../../../server/src/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/UserManagement';
import { ClassManagement } from '@/components/ClassManagement';
import { ReportsSection } from '@/components/ReportsSection';
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  School,
  FileSpreadsheet
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    total_students: 0,
    total_staff: 0,
    total_balance: 0,
    total_transactions_today: 0,
    total_deposits_today: 0,
    total_withdrawals_today: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const dashboardStats = await trpc.getDashboardStats.query({
        userRole: 'ADMINISTRATOR',
        userId: user.id
      });
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            👨‍💼 Administrator Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user.full_name}! Manage your school's savings system.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Students</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : stats.total_students}
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Staff</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : stats.total_staff}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Savings</p>
                <p className="text-xl font-bold">
                  {isLoading ? '...' : formatCurrency(stats.total_balance)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Transactions Today</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : stats.total_transactions_today}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">Deposits Today</p>
                <p className="text-xl font-bold">
                  {isLoading ? '...' : formatCurrency(stats.total_deposits_today)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-teal-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Withdrawals Today</p>
                <p className="text-xl font-bold">
                  {isLoading ? '...' : formatCurrency(stats.total_withdrawals_today)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>User Management</span>
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center space-x-2">
            <School className="h-4 w-4" />
            <span>Class Management</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <ClassManagement />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
