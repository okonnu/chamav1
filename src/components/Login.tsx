import React, { useState } from 'react';
import { User } from '../types';
import { DollarSignIcon, LogInIcon, UserPlusIcon } from 'lucide-react';
import { toast } from 'sonner';
interface LoginProps {
  onLogin: (user: User) => void;
}
export function Login({
  onLogin
}: LoginProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      const user: User = {
        id: Date.now().toString(),
        name: email.split('@')[0],
        email
      };
      toast.success('Welcome back!');
      onLogin(user);
      setLoading(false);
    }, 500);
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      const user: User = {
        id: Date.now().toString(),
        name,
        email
      };
      toast.success('Account created successfully!');
      onLogin(user);
      setLoading(false);
    }, 500);
  };
  return <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <DollarSignIcon className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          ROSCA Manager
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Manage your investment clubs with ease
        </p>
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button onClick={() => setActiveTab('login')} className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'login' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            Login
          </button>
          <button onClick={() => setActiveTab('register')} className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'register' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            Register
          </button>
        </div>
        {/* Login Form */}
        {activeTab === 'login' && <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="john@example.com" required disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="••••••••" required disabled={loading} />
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium">
              <LogInIcon className="w-5 h-5 mr-2" />
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>}
        {/* Register Form */}
        {activeTab === 'register' && <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="John Doe" required disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="john@example.com" required disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="••••••••" required disabled={loading} minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="••••••••" required disabled={loading} minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium">
              <UserPlusIcon className="w-5 h-5 mr-2" />
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>}
        <p className="text-sm text-gray-500 text-center mt-6">
          Your information is stored locally on your device
        </p>
      </div>
    </div>;
}