import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Brain, Mail, AlertCircle, CheckCircle, Lock } from "lucide-react";
import Button from "../components/ui/Button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const email = (location.state as any)?.email || "";

  useEffect(() => {
    if (!email) {
      navigate("/register");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          setError("Verification code has expired. Please resend the code.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Trim whitespace from code
    const trimmedCode = code.trim().replace(/\s/g, "");

    if (!trimmedCode || trimmedCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: trimmedCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setSuccess("Email verified successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setCanResend(false);

    try {
      const response = await fetch(`${API_URL}/api/auth/resend-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      setSuccess("New verification code sent to your email!");
      setCode("");
      setTimeLeft(60);
      setCanResend(false);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
      setCanResend(true);
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
            Verify Email
          </h1>

          <p className="text-gray-600 dark:text-gray-300">
            Complete your registration
          </p>
        </motion.div>

        {/* Verification Card */}
        <motion.div
          className="bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] rounded-xl shadow-xl dark:shadow-2xl border border-[#e8c8eb] dark:border-[#4a3570] p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {/* Email Display */}
          <div className="mb-6 p-4 bg-[#f9f5fa] dark:bg-[#0f0f1e] border border-[#e8c8eb] dark:border-[#4a3570] rounded-lg flex items-center gap-3">
            <Mail size={20} className="text-[#6E2B8A]" />
            <span className="text-sm text-gray-700 dark:text-gray-300 break-all">
              {email}
            </span>
          </div>

          {/* Instructions */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            We've sent a 6-digit verification code to your email. Please enter
            it below to complete your registration.
          </p>

          {/* Error Message */}
          {error && (
            <motion.div
              className="mb-6 p-4 bg-[#f3e8ff] dark:bg-[#2d1b4e] border border-[#d8a4e8] dark:border-[#5a2270] rounded-lg flex items-start gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle
                size={20}
                className="text-[#6E2B8A] dark:text-[#ba5ac3] flex-shrink-0 mt-0.5"
              />
              <span className="text-sm text-[#6E2B8A] dark:text-[#ba5ac3]">
                {error}
              </span>
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg flex items-start gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <CheckCircle
                size={20}
                className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
              />
              <span className="text-sm text-green-700 dark:text-green-300">
                {success}
              </span>
            </motion.div>
          )}

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            {/* Code Input */}
            <div>
              <label className="block text-sm font-semibold text-[#6E2B8A] dark:text-[#ba5ac3] mb-2">
                Verification Code
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-3 text-[#6E2B8A] dark:text-[#ba5ac3]"
                />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(value);
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-[#e8c8eb] dark:border-[#4a3570] dark:bg-[#0f0f1e] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6E2B8A] focus:ring-offset-2 dark:focus:ring-offset-[#16213e] transition-all text-center text-lg font-mono tracking-widest"
                  required
                  autoFocus
                />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Check your email for the 6-digit code
              </p>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-between text-sm">
              <span
                className={`font-semibold ${
                  timeLeft > 10 ? "text-gray-600" : "text-red-600"
                } dark:text-gray-400`}
              >
                Code expires in:{" "}
                <span className="font-bold">{formatTime(timeLeft)}</span>
              </span>
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              loading={loading}
              disabled={code.length !== 6}
              className="w-full bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] text-white font-bold py-2.5 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              Verify Email
            </Button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 border-t border-[#e8c8eb] dark:border-[#4a3570] pt-6">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-3">
              Didn't receive the code?
            </p>

            <Button
              onClick={handleResend}
              disabled={!canResend && timeLeft > 0}
              className="w-full bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] text-white font-bold py-2.5 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {canResend
                ? "Resend Code"
                : timeLeft > 0
                ? "Resend Code Later"
                : "Resend Code"}
            </Button>

            {/* Back to Register - NOW SAME BUTTON STYLE */}
            <div className="mt-4">
              <Button
                onClick={() => navigate("/register")}
                className="w-full bg-gradient-to-r from-[#6E2B8A] to-[#a323af] dark:from-[#ba5ac3] dark:to-[#e8c8eb] text-white font-bold py-2.5 rounded-lg hover:shadow-lg transition-all"
              >
                Back to Register
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Your security is our priority
        </motion.p>
      </motion.div>
    </div>
  );
};

export default VerificationPage;

