"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldAlert, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.message || 'Invalid password');
      }
    } catch (err) {
      setError('Connection error. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center bg-black text-white relative">
          <div className="absolute top-4 left-4">
            <ShieldAlert className="text-orange-500 opacity-50" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-widest mt-4">NINOC ENTERPRISE</h1>
          <p className="text-sm text-gray-400 mt-2">SECURE ADMIN PORTAL</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100">
              {error}
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-black focus:border-black sm:text-sm bg-gray-50 transition-colors"
                placeholder="Enter global admin password"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                ACCESS SECURE PORTAL
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-xs text-gray-500 max-w-sm text-center">
        Unauthorised access to this portal is strictly prohibited and is monitored 24/7. Your IP address is recorded.
      </p>
    </div>
  );
}
