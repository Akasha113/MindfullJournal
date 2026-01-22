import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader,
} from 'lucide-react';
import Button from '../components/ui/Button';
import TextArea from '../components/ui/TextArea';

interface CrisisAlert {
  _id: string;
  userId: { _id: string; name: string; email: string };
  content: string;
  contentType: 'chat' | 'journal';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  detectedKeywords: string[];
  riskFactors: string[];
  status: 'pending' | 'reviewed' | 'addressed' | 'resolved' | 'false_alarm';
  adminNotes: string;
  interventionTaken: string;
  interventionDetails: string;
  followUpRequired: boolean;
  followUpDate: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: { name: string; email: string } | null;
}

const CrisisAlertDetailPage: React.FC = () => {
  const { alertId } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState<CrisisAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('pending');
  const [intervention, setIntervention] = useState('none');
  const [adminNotes, setAdminNotes] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(true);

  useEffect(() => {
    fetchAlert();
  }, [alertId]);

  const fetchAlert = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`http://localhost:3001/api/admin/crisis-alerts/${alertId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch alert');

      const data = await response.json();
      setAlert(data.alert);
      setStatus(data.alert.status);
      setIntervention(data.alert.interventionTaken);
      setAdminNotes(data.alert.adminNotes);
      setFollowUpRequired(data.alert.followUpRequired);
    } catch (err) {
      setError('Failed to load alert details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`http://localhost:3001/api/admin/crisis-alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          interventionTaken: intervention,
          adminNotes,
          followUpRequired,
        }),
      });

      if (!response.ok) throw new Error('Failed to update alert');

      const data = await response.json();
      setAlert(data.alert);
      alert && alert._id && navigate('/admin/dashboard/crisis');
    } catch (err) {
      setError('Failed to update alert');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Button onClick={() => navigate(-1)} variant="secondary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <p className="text-gray-600 mt-4">Alert not found</p>
      </div>
    );
  }

  const riskColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300',
  };

  const statusIcons = {
    pending: <AlertCircle className="w-5 h-5" />,
    reviewed: <Clock className="w-5 h-5" />,
    addressed: <CheckCircle className="w-5 h-5" />,
    resolved: <CheckCircle className="w-5 h-5" />,
    false_alarm: <XCircle className="w-5 h-5" />,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button onClick={() => navigate(-1)} variant="secondary">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Alerts
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Alert Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Risk Badge */}
          <div className={`border-l-4 p-6 ${riskColors[alert.riskLevel]}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                <div>
                  <h1 className="text-2xl font-bold capitalize">{alert.riskLevel} Risk Alert</h1>
                  <p className="text-sm opacity-75">Risk Score: {(alert.riskScore * 100).toFixed(1)}%</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{(alert.riskScore * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">User</h3>
              <p className="font-semibold text-gray-900">{alert.userId.name}</p>
              <p className="text-sm text-gray-600">{alert.userId.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Alert Details</h3>
              <p className="text-sm text-gray-900">
                <strong>Type:</strong> {alert.contentType === 'chat' ? 'Chat Message' : 'Journal Entry'}
              </p>
              <p className="text-sm text-gray-900">
                <strong>Created:</strong> {new Date(alert.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Flagged Content</h3>
            <div className="bg-white p-4 rounded border border-gray-200">
              <p className="text-gray-900 whitespace-pre-wrap">{alert.content}</p>
            </div>
          </div>

          {/* Detection Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Detected Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {alert.detectedKeywords.length > 0 ? (
                  alert.detectedKeywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">None detected</span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Risk Factors</h3>
              <div className="flex flex-wrap gap-2">
                {alert.riskFactors.length > 0 ? (
                  alert.riskFactors.map((factor, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium"
                    >
                      {factor}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">None identified</span>
                )}
              </div>
            </div>
          </div>

          {/* Current Status */}
          {alert.reviewedBy && (
            <div className="p-6 bg-blue-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Review History</h3>
              <p className="text-sm text-gray-900">
                <strong>Reviewed by:</strong> {alert.reviewedBy.name} ({alert.reviewedBy.email})
              </p>
              <p className="text-sm text-gray-900">
                <strong>Reviewed at:</strong> {alert.reviewedAt ? new Date(alert.reviewedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          )}

          {/* Admin Actions */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="pending">Pending Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="addressed">Addressed</option>
                <option value="resolved">Resolved</option>
                <option value="false_alarm">False Alarm</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Intervention</label>
              <select
                value={intervention}
                onChange={(e) => setIntervention(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="none">No Intervention</option>
                <option value="message_sent">Support Message Sent</option>
                <option value="emergency_contact">Emergency Contact Notification</option>
                <option value="escalated_to_authorities">Escalated to Authorities</option>
                <option value="support_resources_shared">Support Resources Shared</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Admin Notes</label>
              <TextArea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Document actions taken, observations, follow-up plans..."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="followUp"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded"
              />
              <label htmlFor="followUp" className="text-sm font-medium text-gray-700">
                Follow-up required
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUpdate}
                disabled={updating}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {updating ? 'Updating...' : 'Save & Update Alert'}
              </Button>
              <Button onClick={() => navigate(-1)} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CrisisAlertDetailPage;
