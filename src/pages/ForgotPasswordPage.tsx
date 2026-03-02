import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetURL, setResetURL] = useState('');
  const [resetCode, setResetCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess(true);
      setEmail('');
      
      // For development: show reset URL if provided
      if (data.resetURL) {
        setResetURL(data.resetURL);
      }
      if (data.resetCode) {
        setResetCode(data.resetCode);
      }
      
      // Redirect to login after 5 seconds
      setTimeout(() => navigate('/login'), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
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
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#6E2B8A] to-[#a323af] bg-clip-text text-transparent">
            Mindful Journal
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Reset your password
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-[#2d1b4e]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {success ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                className="flex justify-center mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircle className="w-12 h-12 text-green-500" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Email sent successfully!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs mb-6">
                Redirecting to login page in 5 seconds...
              </p>
              
              {/* For testing/development: show reset link if email fails */}
              {resetURL && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">🔐 TEST MODE - Reset Link:</p>
                  <a href={resetURL} className="text-xs text-blue-600 dark:text-blue-400 break-all hover:underline block mb-2">
                    {resetURL}
                  </a>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Code: <strong>{resetCode}</strong></p>
                </div>
              )}
              
              <Link to="/login">
                <Button variant="secondary" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6 text-red-700 dark:text-red-400 flex gap-3"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#2d1b4e] dark:bg-[#0f0f1e] focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] dark:text-white"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Enter the email associated with your account
                  </p>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] font-bold py-2.5 rounded-lg hover:shadow-lg transition-all"
                >
                  Send Reset Link
                </Button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] hover:text-[#a323af]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </motion.div>

        {/* Footer Text */}
        <motion.p
          className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          By using this service, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
