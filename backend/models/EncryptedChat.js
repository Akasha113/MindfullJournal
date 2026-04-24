import mongoose from 'mongoose';

/**
 * 🔒 ENCRYPTED CHAT MODEL
 * 
 * Stores encrypted user conversations across all devices/browsers.
 * Data is encrypted on the client before sending to backend.
 * Admin and backend staff CANNOT decrypt user conversations.
 * 
 * Each conversation is encrypted with a user-specific key derived from
 * their password + email (done client-side only).
 */

const EncryptedChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    // Encrypted JSON (encrypted on client, stored as encrypted string)
    encryptedData: {
      type: String,
      required: true,
    },
    // IV (Initialization Vector) used for encryption - unique per message
    iv: {
      type: String,
      required: true,
    },
    // Hash of decrypted data to verify integrity (client can verify without decrypting server copy)
    dataHash: {
      type: String,
      required: true,
    },
    // Last sync timestamp from client
    clientUpdatedAt: {
      type: Date,
      required: true,
    },
    // Whether this is marked for deletion (soft delete)
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    index: { userId: 1, conversationId: 1 }, // Composite index for user + conversation lookup
  }
);

export default mongoose.model('EncryptedChat', EncryptedChatSchema);
