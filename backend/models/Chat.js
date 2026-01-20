import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conversationTitle: {
      type: String,
      default: 'New Conversation',
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        isEdited: {
          type: Boolean,
          default: false,
        },
      },
    ],
    summary: {
      type: String,
      default: '',
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    aiModel: {
      type: String,
      default: 'gpt-4o-mini',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ChatSchema.index({ userId: 1, createdAt: -1 });
ChatSchema.index({ userId: 1, sentiment: 1 });
ChatSchema.index({ userId: 1, riskLevel: 1 });

export default mongoose.model('Chat', ChatSchema);
