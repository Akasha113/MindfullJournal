/**
 * 🔒 CLOUD SYNC UTILITY WITH CLIENT-SIDE ENCRYPTION
 * 
 * Handles syncing chats and journals to backend while keeping data encrypted.
 * Data is encrypted on client before sending to server.
 * Backend stores encrypted data but can't decrypt it.
 * 
 * Privacy: ✅ Admin cannot access user data
 * Sync: ✅ Data syncs across all devices/browsers
 * Local: ✅ Data still cached locally for offline access
 */

import { getUserEncryptionKey, encryptData, decryptData, hashData } from './encryption';
import { getToken, getAuthHeaders, API_URL } from './api';

// =====================
// ENCRYPTED CHAT SYNC
// =====================

/**
 * Save encrypted chat to backend
 */
export const syncChatToBackend = async (
  conversationId: string,
  conversationData: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    const encryptionKey = await getUserEncryptionKey();
    if (!encryptionKey) {
      console.warn('No encryption key available - skipping backend sync');
      return { success: false, error: 'No encryption key' };
    }

    // Encrypt the conversation data
    const { encryptedData, iv, authTag } = await encryptData(conversationData, encryptionKey);
    const dataHash = await hashData(conversationData);

    // Send to backend
    const response = await fetch(`${API_URL}/api/chats/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        conversationId,
        encryptedData,
        iv,
        authTag,
        dataHash,
        clientUpdatedAt: Date.now(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sync chat');
    }

    const result = await response.json();
    console.log('✅ Chat synced to backend:', conversationId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to sync chat to backend:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Fetch all encrypted chats from backend
 */
export const fetchChatsFromBackend = async (): Promise<{
  success: boolean;
  chats?: any[];
  error?: string;
}> => {
  try {
    const response = await fetch(`${API_URL}/api/chats/all`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.chats || data.chats.length === 0) {
      console.log('No chats found on backend');
      return { success: true, chats: [] };
    }

    // Decrypt all chats
    const encryptionKey = await getUserEncryptionKey();
    if (!encryptionKey) {
      console.warn('No encryption key for decryption');
      return { success: false, error: 'No encryption key' };
    }

    const decryptedChats = await Promise.all(
      data.chats.map(async (chat: any) => {
        try {
          const decrypted = await decryptData(
            chat.encryptedData,
            chat.iv,
            chat.authTag,
            encryptionKey
          );
          return {
            conversationId: chat.conversationId,
            data: decrypted,
            synced: true,
          };
        } catch (error) {
          console.error('Failed to decrypt chat:', chat.conversationId, error);
          return null;
        }
      })
    );

    // Filter out failed decryptions
    const validChats = decryptedChats.filter(c => c !== null);

    console.log(`✅ Fetched and decrypted ${validChats.length} chats from backend`);
    return { success: true, chats: validChats };
  } catch (error) {
    console.error('❌ Failed to fetch chats from backend:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Delete chat from backend
 */
export const deleteChatFromBackend = async (conversationId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/chats/${conversationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Chat deleted from backend:', conversationId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to delete chat from backend:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// =====================
// ENCRYPTED JOURNAL SYNC
// =====================

/**
 * Save encrypted journal to backend
 */
export const syncJournalToBackend = async (
  entryId: string,
  journalData: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    const encryptionKey = await getUserEncryptionKey();
    if (!encryptionKey) {
      console.warn('No encryption key available - skipping backend sync');
      return { success: false, error: 'No encryption key' };
    }

    // Encrypt the journal data
    const { encryptedData, iv, authTag } = await encryptData(journalData, encryptionKey);
    const dataHash = await hashData(journalData);

    // Send to backend
    const response = await fetch(`${API_URL}/api/journals/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        entryId,
        encryptedData,
        iv,
        authTag,
        dataHash,
        clientUpdatedAt: Date.now(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sync journal');
    }

    const result = await response.json();
    console.log('✅ Journal synced to backend:', entryId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to sync journal to backend:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Fetch all encrypted journals from backend
 */
export const fetchJournalsFromBackend = async (): Promise<{
  success: boolean;
  journals?: any[];
  error?: string;
}> => {
  try {
    const response = await fetch(`${API_URL}/api/journals/all`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.journals || data.journals.length === 0) {
      console.log('No journals found on backend');
      return { success: true, journals: [] };
    }

    // Decrypt all journals
    const encryptionKey = await getUserEncryptionKey();
    if (!encryptionKey) {
      console.warn('No encryption key for decryption');
      return { success: false, error: 'No encryption key' };
    }

    const decryptedJournals = await Promise.all(
      data.journals.map(async (journal: any) => {
        try {
          const decrypted = await decryptData(
            journal.encryptedData,
            journal.iv,
            journal.authTag,
            encryptionKey
          );
          return {
            entryId: journal.entryId,
            data: decrypted,
            synced: true,
          };
        } catch (error) {
          console.error('Failed to decrypt journal:', journal.entryId, error);
          return null;
        }
      })
    );

    // Filter out failed decryptions
    const validJournals = decryptedJournals.filter(j => j !== null);

    console.log(`✅ Fetched and decrypted ${validJournals.length} journals from backend`);
    return { success: true, journals: validJournals };
  } catch (error) {
    console.error('❌ Failed to fetch journals from backend:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Delete journal from backend
 */
export const deleteJournalFromBackend = async (entryId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/journals/${entryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Journal deleted from backend:', entryId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to delete journal from backend:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// =====================
// SYNC ON LOGIN (Fetch all data from backend)
// =====================

/**
 * Sync all data from backend on login
 * This merges server data with local data
 */
export const syncAllDataOnLogin = async (): Promise<{
  chats: any[];
  journals: any[];
}> => {
  console.log('🔄 Starting full sync on login...');

  const [chatsResult, journalsResult] = await Promise.all([
    fetchChatsFromBackend(),
    fetchJournalsFromBackend(),
  ]);

  return {
    chats: chatsResult.success ? chatsResult.chats || [] : [],
    journals: journalsResult.success ? journalsResult.journals || [] : [],
  };
};
