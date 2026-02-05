import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Mail, Lock, User, AlertCircle } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed');
        setLoading(false);
        return;
      }

      // Redirect to verification page
      navigate('/verify', { state: { email } });
    } catch (err) {
      setError('An error occurred. Please try again.');
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
          <p className="text-gray-600 dark:text-gray-300">Join our wellness community</p>
        </motion.div>

        {/* Register Form */}
        <motion.div
          className="bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] rounded-xl shadow-xl dark:shadow-2xl border border-[#e8c8eb] dark:border-[#4a3570] p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-[#6E2B8A] dark:text-[#ba5ac3] mb-6 text-center">Create Account</h2>

          {error && (
            <motion.div
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3 text-[#6E2B8A] dark:text-[#ba5ac3]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border-2 border-[#e8c8eb] dark:border-[#4a3570] dark:bg-[#0f0f1e] dark:text-white rounded-lg focus:outline-none focus:border-[#6E2B8A] transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-[#6E2B8A] dark:text-[#ba5ac3]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border-2 border-[#e8c8eb] dark:border-[#4a3570] dark:bg-[#0f0f1e] dark:text-white rounded-lg focus:outline-none focus:border-[#6E2B8A] transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-[#6E2B8A] dark:text-[#ba5ac3]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border-2 border-[#e8c8eb] dark:border-[#4a3570] dark:bg-[#0f0f1e] dark:text-white rounded-lg focus:outline-none focus:border-[#6E2B8A] transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-[#6E2B8A] dark:text-[#ba5ac3]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border-2 border-[#e8c8eb] dark:border-[#4a3570] dark:bg-[#0f0f1e] dark:text-white rounded-lg focus:outline-none focus:border-[#6E2B8A] transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </motion.button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#6E2B8A] dark:text-[#ba5ac3] hover:text-[#a323af] font-semibold transition-colors">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
