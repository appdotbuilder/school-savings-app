
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileSpreadsheet, 
  Download, 
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';

export function ReportsSection() {
  const [reportType, setReportType] = useState<string>('global');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation delay
    setTimeout(() => {
      setIsGenerating(false);
      // In a real implementation, this would trigger a download
      alert('Report generated successfully! Download would start in a real implementation.');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-600">Generate comprehensive reports for school savings data</p>
      </div>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Generate Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> This is a stub implementation. In a production environment, 
              reports would be generated from actual database queries and exported as Excel files.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global Savings Summary</SelectItem>
                  <SelectItem value="class">Per Class Report</SelectItem>
                  <SelectItem value="student">Individual Student Reports</SelectItem>
                  <SelectItem value="transactions">Transaction History</SelectItem>
                  <SelectItem value="monthly">Monthly Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Export Format</label>
              <Select defaultValue="excel">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="csv">CSV Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDateRange(prev => ({ ...prev, start: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDateRange(prev => ({ ...prev, end: e.target.value }))
                }
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
                <span>Generating Report...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Generate & Download Report</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-blue-600">245</p>
                <Badge variant="outline" className="mt-1">
                  +12 this month
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">Rp 125M</p>
                <Badge variant="outline" className="mt-1">
                  +8.5% this month
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Growth</p>
                <p className="text-2xl font-bold text-purple-600">15.2%</p>
                <Badge variant="outline" className="mt-1">
                  Above target
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Report History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Monthly Summary - November 2024', date: '2024-11-30', type: 'Monthly', size: '2.3 MB' },
              { name: 'Global Savings Report', date: '2024-11-28', type: 'Global', size: '1.8 MB' },
              { name: 'Class VII Transaction History', date: '2024-11-25', type: 'Class', size: '0.9 MB' }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-gray-600">
                      Generated on {new Date(report.date).toLocaleDateString('id-ID')} • {report.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{report.type}</Badge>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
