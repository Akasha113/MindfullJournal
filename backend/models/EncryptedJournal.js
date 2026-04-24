import mongoose from 'mongoose';

/**
 * 🔒 ENCRYPTED JOURNAL MODEL
 * 
 * Stores encrypted user journal entries across all devices/browsers.
 * Data is encrypted on the client before sending to backend.
 * Admin and backend staff CANNOT decrypt user journal entries.
 * 
 * Each journal entry is encrypted with a user-specific key derived from
 * their password + email (done client-side only).
 */

const EncryptedJournalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Encrypted JSON (encrypted on client, stored as encrypted string)
    encryptedData: {
      type: String,
      required: true,
    },
    // IV (Initialization Vector) used for encryption - unique per entry
    iv: {
      type: String,
      required: true,
    },
    // Authentication tag for GCM mode
    authTag: {
      type: String,
      required: true,
    },
    // Hash of decrypted data to verify integrity
    dataHash: {
      type: String,
      required: true,
    },
    // Last sync timestamp from client
    clientUpdatedAt: {
      type: Date,
      required: true,
    },
    // Whether this is marked for deletion
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('EncryptedJournal', EncryptedJournalSchema);
