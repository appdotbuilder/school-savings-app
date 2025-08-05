
import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import type { CreateTransactionInput, StudentProfile, User as UserType } from '../../../server/src/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  User,
  CheckCircle
} from 'lucide-react';

interface TransactionFormProps {
  staffId: number;
  onSuccess: () => void;
}

// Define the extended type for students with user and class data
type StudentWithDetails = StudentProfile & { 
  user: UserType; 
  class: { name: string } 
};

export function TransactionForm({ staffId, onSuccess }: TransactionFormProps) {
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateTransactionInput>({
    student_id: 0,
    type: 'DEPOSIT',
    amount: 0,
    description: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const allStudents = await trpc.getAllStudents.query();
        setStudents(allStudents);
      } catch (error) {
        console.error('Failed to load students:', error);
      }
    };
    loadStudents();
  }, []);

  const filteredStudents = students.filter((student: StudentWithDetails) =>
    student.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStudentSelect = (student: StudentWithDetails) => {
    setSelectedStudent(student);
    setFormData(prev => ({ ...prev, student_id: student.id }));
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }

    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    // For withdrawals, check if student has sufficient balance
    if (formData.type === 'WITHDRAWAL' && formData.amount > selectedStudent.current_balance) {
      setError('Insufficient balance for withdrawal');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await trpc.createTransaction.mutate({
        ...formData,
        staffId
      });
      
      setSuccess(`Transaction successful! ${formData.type === 'DEPOSIT' ? 'Deposited' : 'Withdrawn'} ${formatCurrency(formData.amount)}`);
      
      // Reset form
      setFormData({
        student_id: 0,
        type: 'DEPOSIT',
        amount: 0,
        description: null
      });
      setSelectedStudent(null);
      
      // Reload students to get updated balance
      const allStudents = await trpc.getAllStudents.query();
      setStudents(allStudents);
      
      onSuccess();
    } catch (error) {
      console.error('Failed to create transaction:', error);
      setError('Failed to process transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Student Selection */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Select Student</span>
          </h3>

          {selectedStudent ? (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">{selectedStudent.user.full_name}</p>
                  <p className="text-sm text-blue-700">NIS: {selectedStudent.nis}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className="bg-blue-100 text-blue-800">
                      Balance: {formatCurrency(selectedStudent.current_balance)}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setSelectedStudent(null)}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Change Student
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search student by name or NIS..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchTerm && (
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No students found matching "{searchTerm}"
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {filteredStudents.slice(0, 10).map((student: StudentWithDetails) => (
                        <button
                          key={student.id}
                          onClick={() => handleStudentSelect(student)}
                          className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{student.user.full_name}</p>
                            <p className="text-sm text-gray-600">NIS: {student.nis}</p>
                          </div>
                          <Badge variant="outline">
                            {formatCurrency(student.current_balance)}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Form */}
      {selectedStudent && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Transaction Details</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Transaction Type *</label>
                  <Select 
                    value={formData.type || 'DEPOSIT'} 
                    onValueChange={(value: 'DEPOSIT' | 'WITHDRAWAL') => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEPOSIT">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span>Deposit (Add Money)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="WITHDRAWAL">
                        <div className="flex items-center space-x-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span>Withdrawal (Take Money)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Amount (IDR) *</label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="Enter amount"
                    min="1"
                    step="1000"
                    required
                  />
                  {formData.amount > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formatCurrency(formData.amount)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
                <Input
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, description: e.target.value || null }))
                  }
                  placeholder="Transaction note or purpose"
                />
              </div>

              {/* Transaction Preview */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">Transaction Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Current Balance:</p>
                    <p className="font-medium">{formatCurrency(selectedStudent.current_balance)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">After Transaction:</p>
                    <p className={`font-medium ${
                      formData.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(
                        formData.type === 'DEPOSIT' 
                          ? selectedStudent.current_balance + (formData.amount || 0)
                          : selectedStudent.current_balance - (formData.amount || 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !selectedStudent || formData.amount <= 0}
                className={`w-full ${
                  formData.type === 'DEPOSIT' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {formData.type === 'DEPOSIT' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      Process {formData.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                    </span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
