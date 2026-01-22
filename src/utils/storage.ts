import {
  UserProfile,
  JournalEntry,
  Conversation,
  Mood,
  MoodEntry,
  FlaggedContent,
  ChatMessage,
} from '../types';
import { checkContent } from './contentMonitor';

// Default user profile
const defaultProfile: UserProfile = {
  name: '',
  isAdmin: false,
  mood: {
    current: 'neutral',
    history: [],
  },
  journals: [],
  conversations: [],
  settings: {
    theme: 'light',
    notifications: false,
    fontSize: 'medium',
    notificationTime: '09:00',
  },
};

// Get current user ID from localStorage
const getCurrentUserId = (): string => {
  const authData = localStorage.getItem('authData');
  if (!authData) return 'default';
  try {
    const parsed = JSON.parse(authData);
    return parsed.id || parsed.email || 'default';
  } catch {
    return 'default';
  }
};

// Storage keys with user isolation
const getStorageKeys = (userId?: string) => {
  const uid = userId || getCurrentUserId();
  return {
    USER_PROFILE: `MindFul_Journal_user_profile_${uid}`,
    JOURNALS: `MindFul_Journal_journals_${uid}`,
    MOOD_ENTRIES: `MindFul_Journal_mood_entries_${uid}`,
    CONVERSATIONS: `MindFul_Journal_conversations_${uid}`,
    FLAGGED_CONTENT: `MindFul_Journal_flagged_content_${uid}`,
  };
};

// Initialize storage
export const initializeStorage = (): UserProfile => {
  const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);

  if (!storedProfile) {
    localStorage.setItem(
      STORAGE_KEYS.USER_PROFILE,
      JSON.stringify(defaultProfile)
    );
    return defaultProfile;
  }

  return JSON.parse(storedProfile);
};

// User profile
export const getUserProfile = (): UserProfile => {
  const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  return storedProfile ? JSON.parse(storedProfile) : initializeStorage();
};

export const updateUserProfile = (
  profile: Partial<UserProfile>
): UserProfile => {
  const currentProfile = getUserProfile();
  const updatedProfile = { ...currentProfile, ...profile };
  localStorage.setItem(
    STORAGE_KEYS.USER_PROFILE,
    JSON.stringify(updatedProfile)
  );
  return updatedProfile;
};

// Flagged content
export const getFlaggedContent = (): FlaggedContent[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.FLAGGED_CONTENT);
  return stored ? JSON.parse(stored) : [];
};

export const addFlaggedContent = (
  content: Omit<FlaggedContent, 'id' | 'timestamp'>
): FlaggedContent => {
  const flaggedContent = getFlaggedContent();
  const newEntry: FlaggedContent = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    ...content,
    riskLevel: content.riskLevel || 'low',
  };
  const updated = [...flaggedContent, newEntry];
  localStorage.setItem(
    STORAGE_KEYS.FLAGGED_CONTENT,
    JSON.stringify(updated)
  );
  return newEntry;
};

export const updateFlaggedContent = (
  id: string,
  updates: Partial<FlaggedContent>
): FlaggedContent | null => {
  const flaggedContent = getFlaggedContent();
  const index = flaggedContent.findIndex(item => item.id === id);

  if (index === -1) return null;

  const updatedItem = { ...flaggedContent[index], ...updates };
  flaggedContent[index] = updatedItem;
  localStorage.setItem(
    STORAGE_KEYS.FLAGGED_CONTENT,
    JSON.stringify(flaggedContent)
  );
  return updatedItem;
};

// Journal entries
export const getJournalEntries = (): JournalEntry[] => {
  const profile = getUserProfile();
  return profile.journals;
};

export const addJournalEntry = (
  entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
): JournalEntry => {
  const profile = getUserProfile();
  const contentCheck = checkContent(entry.content);

  const newEntry: JournalEntry = {
    id: Date.now().toString(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...entry,
    flagged: contentCheck.flagged,
    flagReason: contentCheck.reason,
  };

  const updatedJournals = [...profile.journals, newEntry];
  updateUserProfile({ journals: updatedJournals });

  return newEntry;
};

export const updateJournalEntry = (
  id: string,
  updates: Omit<JournalEntry, 'id' | 'createdAt'>
): JournalEntry | null => {
  const profile = getUserProfile();
  const index = profile.journals.findIndex(journal => journal.id === id);

  if (index === -1) return null;

  const contentCheck = checkContent(updates.content);

  const updatedEntry: JournalEntry = {
    ...profile.journals[index],
    ...updates,
    id,
    createdAt: profile.journals[index].createdAt,
    updatedAt: Date.now(),
    flagged: contentCheck.flagged,
    flagReason: contentCheck.reason,
  };

  profile.journals[index] = updatedEntry;
  updateUserProfile({ journals: profile.journals });

  return updatedEntry;
};

export const deleteJournalEntry = (id: string): boolean => {
  const profile = getUserProfile();
  const updatedJournals = profile.journals.filter(
    journal => journal.id !== id
  );

  if (updatedJournals.length === profile.journals.length) return false;

  updateUserProfile({ journals: updatedJournals });
  return true;
};

// ✅ Mood entries
export const getMoodEntries = (): MoodEntry[] => {
  const profile = getUserProfile();
  return profile.mood.history.map(entry => ({
    ...entry,
    date: entry.date ?? new Date(entry.timestamp).toISOString(),
    note: entry.note ?? '',
  }));
};

export const addMoodEntry = (
  mood: Mood,
  note: string = ''
): MoodEntry => {
  const profile = getUserProfile();

  const newEntry: MoodEntry = {
    id: Date.now().toString(),
    mood,
    note,
    timestamp: Date.now(),
    date: new Date().toISOString(),
  };

  const updatedHistory = [...profile.mood.history, newEntry];

  updateUserProfile({
    mood: {
      current: mood,
      history: updatedHistory,
    },
  });

  return newEntry;
};

// Conversations
export const getConversations = (): Conversation[] => {
  const profile = getUserProfile();
  return profile.conversations;
};

export const getConversation = (id: string): Conversation | null => {
  const profile = getUserProfile();
  return profile.conversations.find(convo => convo.id === id) || null;
};

export const createConversation = (title: string): Conversation => {
  const profile = getUserProfile();
  const newConversation: Conversation = {
    id: Date.now().toString(),
    title,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    hasFlaggedContent: false,
  };

  const updatedConversations = [...profile.conversations, newConversation];
  updateUserProfile({ conversations: updatedConversations });

  return newConversation;
};

export const updateConversation = (
  id: string,
  updates: Partial<Conversation>
): Conversation | null => {
  const profile = getUserProfile();
  const index = profile.conversations.findIndex(convo => convo.id === id);

  if (index === -1) return null;

  const updatedConvo = {
    ...profile.conversations[index],
    ...updates,
    updatedAt: Date.now(),
  };

  profile.conversations[index] = updatedConvo;
  updateUserProfile({ conversations: profile.conversations });

  return updatedConvo;
};

// Chat messages
export const addMessageToConversation = (
  conversationId: string,
  message: Omit<Omit<Omit<ChatMessage, 'id'>, 'timestamp'>, 'conversationId'>
): Conversation | null => {
  const profile = getUserProfile();
  const convoIndex = profile.conversations.findIndex(c => c.id === conversationId);
  if (convoIndex === -1) return null;

  const contentCheck = message.role === 'user' ? checkContent(message.content) : { flagged: false };

  const newMessage: ChatMessage = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    ...message,
    flagged: contentCheck.flagged,
    flagReason: contentCheck.reason,
  };

  profile.conversations[convoIndex].messages.push(newMessage);
  profile.conversations[convoIndex].updatedAt = Date.now();
  profile.conversations[convoIndex].hasFlaggedContent =
    profile.conversations[convoIndex].messages.some(msg => msg.flagged);

  updateUserProfile({ conversations: profile.conversations });

  return profile.conversations[convoIndex];
};

export const deleteConversation = (id: string): boolean => {
  const profile = getUserProfile();
  const updatedConversations = profile.conversations.filter(c => c.id !== id);

  if (updatedConversations.length === profile.conversations.length) return false;

  updateUserProfile({ conversations: updatedConversations });
  return true;
};

// Export all storage functions
export const storage = {
  initializeStorage,
  getUserProfile,
  updateUserProfile,
  getJournalEntries,
  addJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getMoodEntries,
  addMoodEntry,
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  addMessageToConversation,
  deleteConversation,
  getFlaggedContent,
  addFlaggedContent,
  updateFlaggedContent,
};

export default storage;
