
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { User, StaffProfile } from '../../../server/src/schema';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionHistory } from '@/components/TransactionHistory';
import { StudentList } from '@/components/StudentList';
import { StaffReports } from '@/components/StaffReports';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Activity,
  Plus,
  History,
  FileText
} from 'lucide-react';

interface StaffDashboardProps {
  user: User;
}

interface StaffDashboardData {
  students_count: number;
  total_balance_managed: number;
  transactions_today: number;
  recent_students: unknown[];
}

export function StaffDashboard({ user }: StaffDashboardProps) {
  const [dashboardData, setDashboardData] = useState<StaffDashboardData>({
    students_count: 0,
    total_balance_managed: 0,
    transactions_today: 0,
    recent_students: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Get staff profile to use staff_id for transactions
  const [staffProfile, setStaffProfile] = useState<(StaffProfile & { user: User }) | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      // First get staff profile
      const staff = await trpc.getStaffById.query({ id: user.id });
      setStaffProfile(staff);

      // Only proceed if staff profile exists
      if (staff) {
        // Then get dashboard data
        const data = await trpc.getStaffDashboard.query({ staffId: staff.id });
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to load staff dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleTransactionSuccess = () => {
    // Refresh dashboard data after successful transaction
    loadDashboardData();
    // Switch to transaction history tab to show the new transaction
    setActiveTab('history');
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading dashboard...</p>
      </div>
    );
  }

  if (!staffProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Staff profile not found. Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            👨‍🏫 Staff Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user.full_name}! Manage student transactions.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Students Managed</p>
                <p className="text-2xl font-bold">
                  {dashboardData.students_count}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Balance</p>
                <p className="text-xl font-bold">
                  {formatCurrency(dashboardData.total_balance_managed)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Transactions Today</p>
                <p className="text-2xl font-bold">
                  {dashboardData.transactions_today}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Employee ID</p>
                <p className="text-xl font-bold">
                  {staffProfile.employee_id}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Students</span>
          </TabsTrigger>
          <TabsTrigger value="transaction" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Transaction</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Transaction History</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Student List & Balances</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StudentList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transaction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Process Student Transaction</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionForm 
                staffId={staffProfile.id}
                onSuccess={handleTransactionSuccess}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Transaction History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionHistory staffId={staffProfile.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Reports & Exports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StaffReports staffId={staffProfile.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
