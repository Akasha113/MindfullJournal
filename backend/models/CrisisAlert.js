import mongoose from 'mongoose';

const CrisisAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    conversationId: {
      type: String,
      required: false,
    },
    journalId: {
      type: String,
      required: false,
    },
    content: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      enum: ['chat', 'journal'],
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    detectedKeywords: {
      type: [String],
      default: [],
    },
    riskFactors: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'addressed', 'resolved', 'false_alarm'],
      default: 'pending',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    interventionTaken: {
      type: String,
      enum: ['none', 'message_sent', 'emergency_contact', 'escalated_to_authorities', 'support_resources_shared'],
      default: 'none',
    },
    interventionDetails: {
      type: String,
      default: '',
    },
    followUpRequired: {
      type: Boolean,
      default: true,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    urgencyLevel: {
      type: String,
      enum: ['routine', 'urgent', 'emergency'],
      default: 'routine',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
CrisisAlertSchema.index({ userId: 1, status: 1 });
CrisisAlertSchema.index({ riskLevel: 1 });
CrisisAlertSchema.index({ createdAt: -1 });
CrisisAlertSchema.index({ status: 1, reviewedAt: -1 });

export default mongoose.model('CrisisAlert', CrisisAlertSchema);
