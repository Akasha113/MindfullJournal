import mongoose from 'mongoose';

const JournalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    mood: {
      type: String,
      enum: ['excellent', 'good', 'neutral', 'sad', 'anxious', 'angry'],
      default: 'neutral',
    },
    moodScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPrivate: {
      type: Boolean,
      default: true,
    },
    images: [
      {
        type: String,
        url: String,
        uploadedAt: Date,
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
    editHistory: [
      {
        content: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
JournalSchema.index({ userId: 1, createdAt: -1 });
JournalSchema.index({ userId: 1, tags: 1 });
JournalSchema.index({ userId: 1, mood: 1 });

export default mongoose.model('Journal', JournalSchema);
