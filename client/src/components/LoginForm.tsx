
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, User, Lock } from 'lucide-react';

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onLogin(formData.username.trim(), formData.password);
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Sign In
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Enter your credentials to access the system
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="username"
                type="text"
                placeholder="Enter your username or NIS"
                value={formData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, username: e.target.value }))
                }
                className="pl-10"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, password: e.target.value }))
                }
                className="pl-10"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </div>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            📋 Login Information:
          </h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Students:</strong> Use your NIS as username, default password is "nis"</p>
            <p><strong>Staff & Admin:</strong> Use your assigned username and password</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
