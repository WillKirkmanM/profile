'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GitHubAuth() {
  const router = useRouter();

  useEffect(() => {
    router.push('/api/auth');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Redirecting to GitHub...
        </h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">
          You'll be redirected to GitHub to authorize this application.
        </p>
      </div>
    </div>
  );
}