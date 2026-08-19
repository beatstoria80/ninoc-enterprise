"use client";

import React, { useState } from 'react';
import { ShieldAlert, Globe } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/admin`
        }
      });

      if (error) {
        throw error;
      }
      // Redirect happens automatically by Supabase
    } catch (err: any) {
      setError(err.message || 'Connection error. Try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center items-center p-2">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center bg-black text-white relative">
          <div className="absolute top-2 left-4">
            <ShieldAlert className="text-orange-500 opacity-50" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-widest mt-4">NINOC ENTERPRISE</h1>
          <p className="text-xs text-gray-400 mt-2">SECURE ADMIN PORTAL</p>
        </div>
        
        <div className="p-8 text-center">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-xs text-center border border-red-100">
              {error}
            </div>
          )}
          
          <p className="text-sm text-gray-600 mb-6">
            Access to this portal requires a verified Google Workspace account (@ninoc.store). 
            Manual login has been disabled for security reasons.
          </p>
          
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Globe className="mr-2 h-5 w-5 text-gray-500" />
                Sign in with Google
              </>
            )}
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-gray-500 max-w-sm text-center">
        Unauthorised access to this portal is strictly prohibited and is monitored 24/7. Your IP address and OAuth identity are recorded.
      </p>
    </div>
  );
}
