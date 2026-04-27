import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Users, TrendingUp, CheckCircle, Clock, Shield, AlertTriangle, AlertCircle, Zap } from 'lucide-react';
import Button from '../components/ui/Button';

interface Admin {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  createdAt: string;
  isAdmin: boolean;
}

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  newUsersToday: number;
  adminCount: number;
}

interface CrisisAlert {
  _id: string;
  userId: { name: string; email: string };
  content: string;
  contentType: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  riskScore: number;
  status: string;
  createdAt: string;
}

interface CrisisStats {
  totalAlerts: number;
  pendingAlerts: number;
  criticalAlerts: number;
  highRiskAlerts: number;
  emergencyAlerts: number;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [crisisStats, setCrisisStats] = useState<CrisisStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'crisis'>('overview');

  useEffect(() => {
    // if a token is provided in the URL (e.g. from email link), save it so
    // the admin can open the dashboard directly without manually logging in.
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      localStorage.setItem('adminToken', tokenFromUrl);
      // try to decode basic user info from the JWT and store it as well
      try {
        const payload = JSON.parse(atob(tokenFromUrl.split('.')[1]));
        const userObj = {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          isAdmin: payload.isAdmin,
        };
        localStorage.setItem('adminUser', JSON.stringify(userObj));
      } catch (e) {
        console.warn('Failed to decode admin token payload', e);
      }
      // clean up query string so it doesn't persist in history
      window.history.replaceState({}, '', window.location.pathname);
    }

    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    if (!adminToken || !adminUser) {
      navigate('/admin');
      return;
    }

    setAdmin(JSON.parse(adminUser));
    fetchDashboardData(adminToken);
  }, [navigate]);

  const fetchDashboardData = async (token: string) => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, usersRes, crisisStatsRes, crisisAlertsRes] = await Promise.all([
        fetch('http://localhost:3001/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/admin/crisis-stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/admin/crisis-alerts', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!statsRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const crisisStatsData = crisisStatsRes.ok ? await crisisStatsRes.json() : null;
      const crisisAlertsData = crisisAlertsRes.ok ? await crisisAlertsRes.json() : null;

      setStats(statsData.stats);
      setUsers(usersData.users);
      if (crisisStatsData) setCrisisStats(crisisStatsData.stats);
      if (crisisAlertsData) setCrisisAlerts(crisisAlertsData.alerts.slice(0, 10));
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  const getRiskColor = (riskLevel: string) => {
    const colors: { [key: string]: string } = {
      critical: 'text-red-600 bg-red-50',
      high: 'text-orange-600 bg-orange-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50',
    };
    return colors[riskLevel] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#f9f5fa] to-[#f4e4f5] dark:from-[#0f0f1e] dark:via-[#1a1a2e] dark:to-[#16213e] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6E2B8A] mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f9f5fa] to-[#f4e4f5] dark:from-[#0f0f1e] dark:via-[#1a1a2e] dark:to-[#16213e]">
      {/* Header */}
      <header className="bg-white dark:bg-[#16213e] border-b border-[#f4e4f5] dark:border-[#2d1b4e] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#6E2B8A] dark:text-[#a323af] flex items-center gap-1 sm:gap-2">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              Admin Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Welcome, {admin?.name}</p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-[#6E2B8A] hover:bg-[#5a2270] dark:bg-[#a323af] dark:hover:bg-[#8b1b8f] !text-white flex items-center gap-2 text-sm touch-button w-full sm:w-auto"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {error && (
          <motion.div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-8 text-red-700 dark:text-red-400 text-sm sm:text-base">
            {error}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-4 mb-4 sm:mb-8 border-b border-[#f4e4f5] dark:border-[#2d1b4e] overflow-x-auto">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-2 sm:px-4 py-2 font-medium border-b-2 transition !text-white text-xs sm:text-sm whitespace-nowrap ${
              selectedTab === 'overview'
                ? 'bg-gradient-to-r from-[#6E2B8A] to-[#a323af] border-[#6E2B8A] dark:border-[#a323af]'
                : 'bg-[#8B5BA5] dark:bg-[#2d1b4e] border-transparent hover:bg-[#7a4a94] dark:hover:bg-[#3a2860]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('crisis')}
            className={`px-2 sm:px-4 py-2 font-medium border-b-2 transition flex items-center gap-1 !text-white text-xs sm:text-sm whitespace-nowrap ${
              selectedTab === 'crisis'
                ? 'bg-gradient-to-r from-[#6E2B8A] to-[#a323af] border-[#6E2B8A] dark:border-[#a323af]'
                : 'bg-[#8B5BA5] dark:bg-[#2d1b4e] border-transparent hover:bg-[#7a4a94] dark:hover:bg-[#3a2860]'
            }`}
          >
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
            Crisis Alerts
            {crisisStats && crisisStats.pendingAlerts > 0 && (
              <span className="ml-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs">
                {crisisStats.pendingAlerts}
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('users')}
            className={`px-2 sm:px-4 py-2 font-medium border-b-2 transition !text-white text-xs sm:text-sm whitespace-nowrap ${
              selectedTab === 'users'
                ? 'bg-gradient-to-r from-[#6E2B8A] to-[#a323af] border-[#6E2B8A] dark:border-[#a323af]'
                : 'bg-[#8B5BA5] dark:bg-[#2d1b4e] border-transparent hover:bg-[#7a4a94] dark:hover:bg-[#3a2860]'
            }`}
          >
            Users
          </button>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* User Stats */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">User Statistics</h2>
              <div className="grid responsive-grid-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-white dark:bg-[#16213e] rounded-lg shadow p-3 sm:p-6 border-l-4 border-[#6E2B8A]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Users</p>
                      <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                    </div>
                    <Users className="w-8 h-8 sm:w-12 sm:h-12 text-[#6E2B8A] opacity-20 flex-shrink-0" />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#16213e] rounded-lg shadow p-3 sm:p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Verified Users</p>
                      <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.verifiedUsers}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-green-500 opacity-20 flex-shrink-0" />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#16213e] rounded-lg shadow p-3 sm:p-6 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Unverified Users</p>
                      <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.unverifiedUsers}</p>
                    </div>
                    <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-orange-500 opacity-20 flex-shrink-0" />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#16213e] rounded-lg shadow p-3 sm:p-6 border-l-4 border-[#a323af]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">New Today</p>
                      <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.newUsersToday}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-[#a323af] opacity-20 flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Crisis Stats */}
            {crisisStats && (
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Crisis Monitoring</h2>
                <div className="grid responsive-grid-2 lg:grid-cols-4 gap-2 sm:gap-4">
                  <div className="bg-white dark:bg-[#16213e] rounded-lg shadow p-3 sm:p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Critical Alerts</p>
                        <p className="text-xl sm:text-3xl font-bold text-red-600">{crisisStats.criticalAlerts}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 sm:w-12 sm:h-12 text-red-500 opacity-20 flex-shrink-0" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#16213e] rounded-lg shadow p-3 sm:p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">High Risk Alerts</p>
                        <p className="text-xl sm:text-3xl font-bold text-orange-600">{crisisStats.highRiskAlerts}</p>
                      </div>
                      <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-orange-500 opacity-20 flex-shrink-0" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#16213e] rounded-lg shadow p-3 sm:p-6 border-l-4 border-[#6E2B8A]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Pending Review</p>
                        <p className="text-xl sm:text-3xl font-bold text-[#6E2B8A]">{crisisStats.pendingAlerts}</p>
                      </div>
                      <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-[#6E2B8A] opacity-20 flex-shrink-0" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#16213e] rounded-lg shadow p-3 sm:p-6 border-l-4 border-red-700">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Emergency Alerts</p>
                        <p className="text-xl sm:text-3xl font-bold text-red-700">{crisisStats.emergencyAlerts}</p>
                      </div>
                      <Zap className="w-8 h-8 sm:w-12 sm:h-12 text-red-600 opacity-20 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Crisis Tab */}
        {selectedTab === 'crisis' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Crisis Alerts</h2>
              {crisisStats && (
                <span className="text-sm text-gray-600">
                  Total: {crisisStats.totalAlerts} | Pending: {crisisStats.pendingAlerts}
                </span>
              )}
            </div>

            {crisisAlerts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-50" />
                <p className="text-gray-600">No crisis alerts at the moment</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Risk Level</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Content</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {crisisAlerts.map((alert) => (
                        <tr key={alert._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-900">{alert.userId?.name || 'Unknown User'}</td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getRiskColor(
                                alert.riskLevel
                              )}`}
                            >
                              {alert.riskLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {alert.content.substring(0, 40)}...
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                                alert.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {alert.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Button
                              onClick={() => navigate(`/admin/crisis-alerts/${alert._id}`)}
                              className="bg-gradient-to-r from-[#6E2B8A] to-[#a323af] hover:from-[#5a2270] hover:to-[#8b1b8f] !text-white text-xs px-3 py-1"
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#16213e] rounded-lg shadow overflow-hidden border border-[#f4e4f5] dark:border-[#2d1b4e]"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f4e4f5] dark:bg-[#2d1b4e] border-b border-[#e8c8eb] dark:border-[#3a2860]">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#6E2B8A] dark:text-[#a323af]">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#6E2B8A] dark:text-[#a323af]">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#6E2B8A] dark:text-[#a323af]">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#6E2B8A] dark:text-[#a323af]">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#6E2B8A] dark:text-[#a323af]">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4e4f5] dark:divide-[#2d1b4e]">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#f9f5fa] dark:hover:bg-[#2d1b4e] transition">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            user.verified
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                          }`}
                        >
                          {user.verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            user.isAdmin
                              ? 'bg-[#f4e4f5] dark:bg-[#2d1b4e] text-[#6E2B8A] dark:text-[#a323af]'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-[#f9f5fa] dark:bg-[#2d1b4e] border-t border-[#f4e4f5] dark:border-[#2d1b4e]">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total: {users.length} users</p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
