
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Transaction } from '../../../server/src/schema';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download
} from 'lucide-react';

interface TransactionHistoryProps {
  staffId: number;
}

// Define the extended type for transactions with student data
type TransactionWithStudent = Transaction & { 
  student: { 
    user: { full_name: string }; 
    nis: string 
  } 
};

export function TransactionHistory({ staffId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const loadTransactions = useCallback(async () => {
    try {
      const date = new Date(selectedDate);
      const transactionData = await trpc.getTransactionsByStaff.query({ 
        staffId, 
        date 
      });
      setTransactions(transactionData);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [staffId, selectedDate]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

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
    return type === 'DEPOSIT' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const totalDeposits = transactions
    .filter(t => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'WITHDRAWAL')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Date Filter and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Select Date</h3>
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Daily Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <p className="text-green-600 font-semibold">
                  +{formatCurrency(totalDeposits)}
                </p>
                <p className="text-gray-600">Deposits</p>
              </div>
              <div className="text-center">
                <p className="text-red-600 font-semibold">
                  -{formatCurrency(totalWithdrawals)}
                </p>
                <p className="text-gray-600">Withdrawals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Transactions ({transactions.length})</span>
            </CardTitle>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No transactions found</p>
              <p className="text-sm text-gray-500">
                No transactions were processed on {new Date(selectedDate).toLocaleDateString('id-ID')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction: TransactionWithStudent) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full border ${getTransactionColor(transaction.type)}`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{transaction.student?.user?.full_name || 'Unknown Student'}</p>
                        <Badge className={`${getTransactionColor(transaction.type)} border`}>
                          {transaction.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        NIS: {transaction.student?.nis || 'N/A'} • {new Date(transaction.transaction_date).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {transaction.description && (
                        <p className="text-sm text-gray-500 mt-1">{transaction.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'DEPOSIT' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <div className="text-sm text-gray-600">
                      <p>Before: {formatCurrency(transaction.balance_before)}</p>
                      <p>After: {formatCurrency(transaction.balance_after)}</p>
                    </div>
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
