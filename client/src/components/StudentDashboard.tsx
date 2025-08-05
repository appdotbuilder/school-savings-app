
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { User, Transaction, StudentProfile } from '../../../server/src/schema';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PasswordChangeForm } from '@/components/PasswordChangeForm';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  History,
  Phone,
  Mail,
  User as UserIcon,
  Settings
} from 'lucide-react';

interface StudentDashboardProps {
  user: User;
}

interface StudentDashboardData {
  current_balance: number;
  recent_transactions: Transaction[];
  assigned_staff: {
    full_name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [dashboardData, setDashboardData] = useState<StudentDashboardData>({
    current_balance: 0,
    recent_transactions: [],
    assigned_staff: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<(StudentProfile & { user: User; class: { name: string } }) | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      // Get student profile first
      const student = await trpc.getStudentById.query({ id: user.id });
      setStudentProfile(student);

      // Only proceed if student profile exists
      if (student) {
        // Get dashboard data
        const data = await trpc.getStudentDashboard.query({ studentId: student.id });
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to load student dashboard:', error);
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

  const getTransactionIcon = (type: string) => {
    return type === 'DEPOSIT' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTransactionColor = (type: string) => {
    return type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading dashboard...</p>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Student profile not found. Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🎓 Student Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user.full_name}! Check your savings balance and history.
          </p>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">💰 Current Savings Balance</p>
                <p className="text-4xl font-bold mt-2">
                  {formatCurrency(dashboardData.current_balance)}
                </p>
                <p className="text-green-200 text-sm mt-2">
                  Keep saving for your future! 🌟
                </p>
              </div>
              <DollarSign className="h-16 w-16 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <UserIcon className="h-5 w-5" />
              <span>Student Info</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <p className="text-gray-600">NIS:</p>
              <p className="font-medium">{studentProfile.nis}</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-600">Class:</p>
              <p className="font-medium">{studentProfile.class?.name || 'N/A'}</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-600">Member Since:</p>
              <p className="font-medium">
                {studentProfile.created_at.toLocaleDateString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Transaction History</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>Staff Contact</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Recent Transactions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.recent_transactions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No transactions yet</p>
                  <p className="text-sm text-gray-500">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recent_transactions.map((transaction: Transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium">
                            {transaction.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.transaction_date).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          {transaction.description && (
                            <p className="text-sm text-gray-500">{transaction.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'DEPOSIT' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Balance: {formatCurrency(transaction.balance_after)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Assigned Staff Contact</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.assigned_staff ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                    <div className="bg-blue-100 rounded-full p-3">
                      <UserIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">
                        {dashboardData.assigned_staff.full_name}
                      </p>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Staff Member
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {dashboardData.assigned_staff.email && (
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{dashboardData.assigned_staff.email}</p>
                        </div>
                      </div>
                    )}

                    {dashboardData.assigned_staff.phone && (
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{dashboardData.assigned_staff.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Need help?</strong> Contact your assigned staff member for any questions 
                      about your savings account or to make transactions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No assigned staff member</p>
                  <p className="text-sm text-gray-500">Contact your teacher or administrator</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Account Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PasswordChangeForm userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
