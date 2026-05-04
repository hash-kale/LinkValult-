/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth } from './hooks/useAuth';
import Dashboard from './components/Dashboard';
import AuthScreen from './components/AuthScreen';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-secondary animate-spin" />
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthScreen />;
}
