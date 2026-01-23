import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f9f5fa] to-[#f4e4f5] dark:from-[#0f0f1e] dark:via-[#1a1a2e] dark:to-[#16213e] flex items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo Section */}
        <motion.div
          className="text-center mb-8"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-4">
            <motion.div
              className="h-16 w-16 bg-gradient-to-br from-[#6E2B8A] to-[#a323af] rounded-full flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Brain size={32} className="text-white" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] bg-clip-text text-transparent mb-2">
            Mindful Journal
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Your AI Mental Wellness Companion</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          className="bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] rounded-xl shadow-xl dark:shadow-2xl border border-[#e8c8eb] dark:border-[#4a3570] p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-[#6E2B8A] dark:text-[#ba5ac3] mb-1">Welcome Back</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Sign in to your account</p>

          {/* Error Message */}
          {error && (
            <motion.div
              className="mb-6 p-4 bg-[#f3e8ff] dark:bg-[#2d1b4e] border border-[#d8a4e8] dark:border-[#5a2270] rounded-lg flex items-start gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle size={20} className="text-[#6E2B8A] dark:text-[#ba5ac3] flex-shrink-0 mt-0.5" />
              <span className="text-sm text-[#6E2B8A] dark:text-[#ba5ac3]">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-[#6E2B8A] dark:text-[#ba5ac3]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-[#e8c8eb] dark:border-[#4a3570] dark:bg-[#0f0f1e] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:ring-offset-2 dark:focus:ring-offset-[#16213e] transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-[#6E2B8A] dark:text-[#ba5ac3]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-[#e8c8eb] dark:border-[#4a3570] dark:bg-[#0f0f1e] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:ring-offset-2 dark:focus:ring-offset-[#16213e] transition-all"
                  required
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#6E2B8A]" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] hover:text-[#a323af]">
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              loading={loading}
              className="w-full bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] font-bold py-2.5 rounded-lg hover:shadow-lg transition-all"
            >
              <LogIn size={18} />
              Sign In
            </Button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] hover:text-[#a323af]">
              Create one
            </Link>
          </p>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          By signing in, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
