
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Printer,
  FileSpreadsheet,
  BookOpen
} from 'lucide-react';

interface StaffReportsProps {
  staffId: number;
}

export function StaffReports({ staffId }: StaffReportsProps) {
  const [reportType, setReportType] = useState<string>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation delay
    setTimeout(() => {
      setIsGenerating(false);
      alert('Report generated successfully! Download would start in a real implementation.');
    }, 1500);
  };

  const handlePrintSavingsBook = (studentName: string) => {
    alert(`Printing savings book for ${studentName}. In a real implementation, this would open a print dialog with the student's transaction history.`);
  };

  // Note: staffId is available for use in actual report generation
  console.log('Staff ID for reports:', staffId);

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> This is a stub implementation. In production, reports would be 
          generated from actual transaction data and exported in various formats.
        </AlertDescription>
      </Alert>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Generate Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Transaction Summary</SelectItem>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="student">Individual Student Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Generate Excel Report</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Student Savings Books */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Student Savings Books</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Print individual savings books showing transaction history for students
          </p>
          
          <div className="space-y-3">
            {[
              { name: 'Ahmad Fadli', nis: '2024001', balance: 125000, class: 'VII-A' },
              { name: 'Sari Dewi', nis: '2024002', balance: 89000, class: 'VII-A' },
              { name: 'Budi Santoso', nis: '2024003', balance: 156000, class: 'VII-B' },
              { name: 'Maya Sari', nis: '2024004', balance: 67000, class: 'VII-B' }
            ].map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-600">
                      NIS: {student.nis} • Class: {student.class}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">
                    Rp {student.balance.toLocaleString('id-ID')}
                  </Badge>
                  <Button 
                    onClick={() => handlePrintSavingsBook(student.name)}
                    variant="outline" 
                    size="sm"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Print Book
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-blue-600">12</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Deposits</p>
              <p className="text-xl font-bold text-green-600">Rp 245K</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Withdrawals</p>
              <p className="text-xl font-bold text-red-600">Rp 89K</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Net Change</p>
              <p className="text-xl font-bold text-purple-600">+Rp 156K</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
