
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { User, UserRole } from '../../server/src/schema';
import { LoginForm } from '@/components/LoginForm';
import { AdminDashboard } from '@/components/AdminDashboard';
import { StaffDashboard } from '@/components/StaffDashboard';
import { StudentDashboard } from '@/components/StudentDashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, Users, GraduationCap } from 'lucide-react';

interface AuthState {
  user: User | null;
  sessionId: string | null;
  isLoading: boolean;
}

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    sessionId: null,
    isLoading: true
  });

  const validateSession = useCallback(async (sessionId: string) => {
    try {
      const user = await trpc.validateSession.query({ sessionId });
      if (user) {
        setAuthState({
          user,
          sessionId,
          isLoading: false
        });
      } else {
        // Invalid session, clear storage
        localStorage.removeItem('sessionId');
        setAuthState({
          user: null,
          sessionId: null,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      localStorage.removeItem('sessionId');
      setAuthState({
        user: null,
        sessionId: null,
        isLoading: false
      });
    }
  }, []);

  // Load session from localStorage on app start
  useEffect(() => {
    const savedSessionId = localStorage.getItem('sessionId');
    if (savedSessionId) {
      validateSession(savedSessionId);
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [validateSession]);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await trpc.login.mutate({ username, password });
      const { user, session } = response;
      
      // Store session in localStorage
      localStorage.setItem('sessionId', session.id);
      
      setAuthState({
        user,
        sessionId: session.id,
        isLoading: false
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    if (authState.sessionId) {
      try {
        await trpc.logout.mutate({ sessionId: authState.sessionId });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
    
    localStorage.removeItem('sessionId');
    setAuthState({
      user: null,
      sessionId: null,
      isLoading: false
    });
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return <Shield className="h-5 w-5" />;
      case 'STAFF':
        return <Users className="h-5 w-5" />;
      case 'STUDENT':
        return <GraduationCap className="h-5 w-5" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return 'text-purple-600';
      case 'STAFF':
        return 'text-blue-600';
      case 'STUDENT':
        return 'text-green-600';
    }
  };

  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!authState.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-white rounded-full p-4 inline-block shadow-lg mb-4">
              <GraduationCap className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              💰 Student Savings
            </h1>
            <p className="text-gray-600">School Financial Management System</p>
          </div>
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 rounded-lg p-2">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  💰 Student Savings
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`${getRoleColor(authState.user.role)}`}>
                  {getRoleIcon(authState.user.role)}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {authState.user.full_name}
                  </p>
                  <p className={`${getRoleColor(authState.user.role)} capitalize`}>
                    {authState.user.role.toLowerCase()}
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {authState.user.role === 'ADMINISTRATOR' && (
          <AdminDashboard user={authState.user} />
        )}
        {authState.user.role === 'STAFF' && (
          <StaffDashboard user={authState.user} />
        )}
        {authState.user.role === 'STUDENT' && (
          <StudentDashboard user={authState.user} />
        )}
      </main>
    </div>
  );
}

export default App;
