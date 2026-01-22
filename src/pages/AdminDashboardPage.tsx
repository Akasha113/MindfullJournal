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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600">Welcome, {admin?.name}</p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <motion.div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-red-700">
            {error}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              selectedTab === 'overview'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('crisis')}
            className={`px-4 py-2 font-medium border-b-2 transition flex items-center gap-2 ${
              selectedTab === 'crisis'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Crisis Alerts
            {crisisStats && crisisStats.pendingAlerts > 0 && (
              <span className="ml-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {crisisStats.pendingAlerts}
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('users')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              selectedTab === 'users'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
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
            className="space-y-6"
          >
            {/* User Stats */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                    <Users className="w-12 h-12 text-blue-500 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Verified Users</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.verifiedUsers}</p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Unverified Users</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.unverifiedUsers}</p>
                    </div>
                    <Clock className="w-12 h-12 text-orange-500 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">New Today</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.newUsersToday}</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Crisis Stats */}
            {crisisStats && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Crisis Monitoring</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Critical Alerts</p>
                        <p className="text-3xl font-bold text-red-600">{crisisStats.criticalAlerts}</p>
                      </div>
                      <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">High Risk Alerts</p>
                        <p className="text-3xl font-bold text-orange-600">{crisisStats.highRiskAlerts}</p>
                      </div>
                      <AlertCircle className="w-12 h-12 text-orange-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Pending Review</p>
                        <p className="text-3xl font-bold text-purple-600">{crisisStats.pendingAlerts}</p>
                      </div>
                      <Clock className="w-12 h-12 text-purple-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Emergency Alerts</p>
                        <p className="text-3xl font-bold text-red-700">{crisisStats.emergencyAlerts}</p>
                      </div>
                      <Zap className="w-12 h-12 text-red-600 opacity-20" />
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
                          <td className="px-6 py-4 text-sm text-gray-900">{alert.userId.name}</td>
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
                              className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1"
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
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            user.verified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {user.verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            user.isAdmin
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">Total: {users.length} users</p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
