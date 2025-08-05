
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle
} from 'lucide-react';

interface PasswordChangeFormProps {
  userId: number;
}

export function PasswordChangeForm({ userId }: PasswordChangeFormProps) {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (formData.new_password.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await trpc.updatePassword.mutate({
        userId,
        current_password: formData.current_password,
        new_password: formData.new_password
      });
      
      setSuccess('Password changed successfully!');
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      setError('Failed to change password. Please check your current password and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Lock className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Change Password</h3>
        </div>

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Current Password *</label>
            <div className="relative">
              <Input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.current_password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, current_password: e.target.value }))
                }
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">New Password *</label>
            <div className="relative">
              <Input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.new_password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, new_password: e.target.value }))
                }
                className="pr-10"
                placeholder="At least 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Confirm New Password *</label>
            <div className="relative">
              <Input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, confirm_password: e.target.value }))
                }
                className="pr-10"
                placeholder="Re-enter new password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  formData.new_password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span>At least 6 characters long</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  formData.new_password === formData.confirm_password && formData.new_password !== ''
                    ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span>Passwords match</span>
              </li>
            </ul>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || !formData.current_password || !formData.new_password || !formData.confirm_password}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Changing Password...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Change Password</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
