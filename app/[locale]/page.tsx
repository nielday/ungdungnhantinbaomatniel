'use client';

import { useAuth } from '@/components/AuthContext';
import { useTranslations } from 'next-intl';
import AuthPage from '@/components/AuthPage';
import ChatApp from '@/components/ChatApp';

export default function Home() {
  const { user, loading } = useAuth();
  const t = useTranslations();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <ChatApp />;
}