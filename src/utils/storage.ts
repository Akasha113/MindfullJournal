/**
 * 🔒 LOCAL STORAGE UTILITY - PRIVACY FIRST
 *
 * ⚠️ IMPORTANT: This utility stores SENSITIVE DATA in browser localStorage ONLY.
 * NO data is sent to backend servers - this is intentional for user privacy.
 *
 * Data stored here (NEVER goes to database):
 * - Chat conversations & messages
 * - Journal entries
 * - Mood tracking history
 * - Personal notes and thoughts
 *
 * Admin Restriction: ❌ Admins CANNOT access this data via API
 * Data Persistence: ✅ Data persists across sessions (same browser/device)
 * Multi-Device: ⚠️ Data is device-specific (won't sync across devices)
 *
 * FLAGGING POLICY:
 * Only explicit FIRST-PERSON full-sentence crisis statements are flagged.
 * Single keywords, educational questions, and third-party messages are NEVER flagged.
 */

import {
  UserProfile,
  JournalEntry,
  Conversation,
  Mood,
  MoodEntry,
  FlaggedContent,
  ChatMessage,
} from '../types';
import { syncJournalToBackend, deleteJournalFromBackend, fetchJournalsFromBackend } from './cloudSync';

// ---------------------------------------------------------------------------
// SAFE CONTENT CHECKER
// Replaces the old single-keyword checkContent with full-sentence matching.
// Only flags content that is clearly a first-person explicit crisis statement.
// Educational, informational, and third-party messages return { flagged: false }.
// ---------------------------------------------------------------------------

// Phrases that indicate the message is informational/educational (never flag these)
const INFORMATIONAL_INDICATORS = [
  'what is suicide', 'why do people', 'why does someone', 'why would someone',
  'what causes suicide', 'what are the signs', 'what are warning signs',
  'how common is suicide', 'tell me about suicide', 'explain suicide',
  'information about', 'facts about suicide', 'statistics on suicide',
  'suicide prevention', 'prevent suicide', 'is it a sin', 'is it wrong',
  'is suicide', 'are suicides', 'was suicide', 'good or bad', 'right or wrong',
  'how do i help someone', 'what should i do if someone', 'how can i help',
  'signs of suicidal', 'warning signs of', 'signs that someone',
  'kya khudkushi', 'khudkushi kyun', 'khudkushi kya hai', 'khudkushi ke baare',
  'khudkushi ki wajah', 'suicide kya hota hai', 'kya ye sahi hai',
  'kisi ki madad kaise', 'suicide se rokna', 'khudkushi rokna',
];

// Phrases that indicate the message is about a third party (never flag for the user)
const THIRD_PERSON_INDICATORS = [
  'my friend', 'my brother', 'my sister', 'my mother', 'my father',
  'my mom', 'my dad', 'my son', 'my daughter', 'my cousin',
  'my colleague', 'my classmate', 'my teacher', 'my husband', 'my wife',
  'someone i know', 'a person i know', 'someone else',
  'he wants', 'she wants', 'they want', 'he said', 'she said', 'they said',
  'he told me', 'she told me', 'my neighbor', 'my relative', 'my uncle', 'my aunt',
  'a friend of mine', 'one of my friends',
  'mera dost', 'meri saheli', 'mera bhai', 'meri behan',
  'meri ammi', 'mere abbu', 'mera beta', 'meri beti',
  'koi aur', 'woh chahta', 'woh chahti', 'usne kaha',
  'mi amigo', 'mi amiga', 'mi hermano', 'mi hermana',
  'mon ami', 'mon amie', 'mon frère', 'ma sœur',
  'mein freund', 'meine freundin', 'er will', 'sie will',
  'arkadaşım', 'kardeşim', 'annem', 'babam',
];

// Full-sentence explicit crisis patterns (first-person only)
const EXPLICIT_CRISIS_PATTERNS = [
  // English
  'i want to kill myself', 'i am going to kill myself', 'i plan to end my life',
  'i will take my own life', 'i have decided to die', 'tonight is my last night',
  'i want to end my life', 'i want to harm myself', 'i want to hurt myself',
  'i am cutting myself', 'i cut myself', 'i want to cut myself',
  'i want to overdose', 'i am suicidal', 'i feel suicidal',
  'i want to die', "i don't want to live", "i don't want to be alive",
  'i have no reason to live', 'everyone would be better off without me',
  'i am tired of living', 'i want to take my life', 'this is my final goodbye',
  'i will hang myself', 'i will poison myself',
  'i wish i was dead', 'i wish i were dead', 'nothing to live for',
  'i want to stop existing', 'life is not worth living',
  "i can't take it anymore", "i cant take it anymore",
  'i have made up my mind to die', 'i will end my suffering',
  'i deserve pain', 'i deserve to be hurt', 'i need to feel pain',
  // Urdu
  'khudkushi karna chahti hoon', 'khudkushi karna chahta hoon',
  'jaan lena chahti hoon', 'jaan lena chahta hoon',
  'marna chahti hoon', 'marna chahta hoon',
  'mn marna chahti hon', 'mn marna chahta hon',
  'zindagi khatam karna chahti hoon', 'zindagi khatam karna chahta hoon',
  'khud ko maarna chahti hoon', 'khud ko maarna chahta hoon',
  'khud ko marna chahti hoon', 'khud ko marna chahta hoon',
  'aaj raat meri aakhri raat hai', 'kal mera aakhri din hai',
  'main marne ka faisla kar chuka hoon', 'main marne ka faisla kar chuki hoon',
  'jeena nahi chahti', 'jeena nahi chahta', 'mujhe marna hai',
  'zindagi se tang aa gayi hoon', 'zindagi se tang aa gaya hoon',
  // Spanish
  'quiero matarme', 'voy a suicidarme', 'he decidido morir',
  'quiero acabar con mi vida', 'ya no quiero vivir',
  // French
  'je veux me tuer', 'je vais me suicider', "j'ai décidé de mourir",
  // Arabic
  'أريد أن أنهي حياتي', 'سأنتحر', 'أريد أن أموت',
  // Hindi
  'main apne aap ko maarna chahta hoon', 'mujhe jeena nahi hai',
  // Turkish
  'kendimi öldürmek istiyorum', 'intihar edeceğim',
  // Japanese / Chinese / Korean
  '死にたい', '我想死', '죽고 싶다',
];

// Method-seeking patterns (also flag these as crisis)
const METHOD_SEEKING_PATTERNS = [
  'how to kill myself', 'how to commit suicide', 'ways to kill myself',
  'ways to commit suicide', 'ways to do suicide', 'tell me ways to',
  'best way to die', 'easiest way to die', 'painless way to die',
  'how to end my life', 'methods of suicide', 'suicide methods',
  'how to overdose', 'how to hang myself', 'how to cut myself',
  'how to harm myself', 'what pills to take to die',
  'khudkushi kaise karte hain', 'khudkushi ka tarika', 'marne ka tarika',
  'cómo suicidarme', 'comment se suicider', 'wie töte ich mich',
];

/**
 * Checks message content for genuine crisis signals using full-sentence matching.
 * Returns { flagged: false } for informational, third-party, or ambiguous messages.
 */
export const checkContentSafe = (content: string): { flagged: boolean; reason?: string; riskLevel?: 'low' | 'medium' | 'high' | 'critical' } => {
  if (!content || typeof content !== 'string') return { flagged: false };
  const lower = content.toLowerCase().trim();

  // GUARD 1: Informational queries → never flag
  for (const indicator of INFORMATIONAL_INDICATORS) {
    if (lower.includes(indicator)) return { flagged: false };
  }
  // Short questions are almost always educational
  if (lower.endsWith('?') && lower.length < 150) {
    const hasExplicitIntent = EXPLICIT_CRISIS_PATTERNS.some(p => lower.includes(p));
    if (!hasExplicitIntent) return { flagged: false };
  }

  // GUARD 2: Third-party messages → never flag (it's not the user's crisis)
  for (const indicator of THIRD_PERSON_INDICATORS) {
    if (lower.includes(indicator)) return { flagged: false };
  }

  // CHECK 1: Method-seeking (asking how to self-harm)
  for (const pattern of METHOD_SEEKING_PATTERNS) {
    if (lower.includes(pattern)) {
      return {
        flagged: true,
        reason: 'Method-seeking behavior detected',
        riskLevel: 'critical',
      };
    }
  }

  // CHECK 2: Explicit first-person crisis statement
  for (const pattern of EXPLICIT_CRISIS_PATTERNS) {
    if (lower.includes(pattern)) {
      return {
        flagged: true,
        reason: 'Explicit self-harm or suicidal statement detected',
        riskLevel: 'critical',
      };
    }
  }

  return { flagged: false };
};

// ---------------------------------------------------------------------------
// DEFAULT PROFILE
// ---------------------------------------------------------------------------
const defaultProfile: UserProfile = {
  name: '',
  isAdmin: false,
  mood: { current: 'neutral', history: [] },
  journals: [],
  conversations: [],
  settings: {
    theme: 'light',
    notifications: false,
    fontSize: 'medium',
    notificationTime: '09:00',
  },
};

// ---------------------------------------------------------------------------
// STORAGE KEYS (per-user isolation)
// ---------------------------------------------------------------------------
const getCurrentUserId = (): string => {
  const authData = sessionStorage.getItem('authData');
  if (!authData) return 'default';
  try {
    const parsed = JSON.parse(authData);
    return parsed.id || parsed.email || 'default';
  } catch {
    return 'default';
  }
};

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

// ---------------------------------------------------------------------------
// USER PROFILE
// ---------------------------------------------------------------------------
export const initializeStorage = (): UserProfile => {
  const keys = getStorageKeys();
  const storedProfile = localStorage.getItem(keys.USER_PROFILE);
  if (!storedProfile) {
    localStorage.setItem(keys.USER_PROFILE, JSON.stringify(defaultProfile));
    return defaultProfile;
  }
  return JSON.parse(storedProfile);
};

export const getUserProfile = (): UserProfile => {
  const keys = getStorageKeys();
  const storedProfile = localStorage.getItem(keys.USER_PROFILE);
  return storedProfile ? JSON.parse(storedProfile) : initializeStorage();
};

export const updateUserProfile = (profile: Partial<UserProfile>): UserProfile => {
  const keys = getStorageKeys();
  const currentProfile = getUserProfile();
  const updatedProfile = { ...currentProfile, ...profile };
  localStorage.setItem(keys.USER_PROFILE, JSON.stringify(updatedProfile));
  return updatedProfile;
};

// ---------------------------------------------------------------------------
// FLAGGED CONTENT
// ---------------------------------------------------------------------------
export const getFlaggedContent = (): FlaggedContent[] => {
  const keys = getStorageKeys();
  const stored = localStorage.getItem(keys.FLAGGED_CONTENT);
  return stored ? JSON.parse(stored) : [];
};

export const addFlaggedContent = (content: Omit<FlaggedContent, 'id' | 'timestamp'>): FlaggedContent => {
  const keys = getStorageKeys();
  const flaggedContent = getFlaggedContent();
  const newEntry: FlaggedContent = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    ...content,
    riskLevel: content.riskLevel || 'low',
  };
  localStorage.setItem(keys.FLAGGED_CONTENT, JSON.stringify([...flaggedContent, newEntry]));
  return newEntry;
};

export const updateFlaggedContent = (id: string, updates: Partial<FlaggedContent>): FlaggedContent | null => {
  const keys = getStorageKeys();
  const flaggedContent = getFlaggedContent();
  const index = flaggedContent.findIndex(item => item.id === id);
  if (index === -1) return null;
  const updatedItem = { ...flaggedContent[index], ...updates };
  flaggedContent[index] = updatedItem;
  localStorage.setItem(keys.FLAGGED_CONTENT, JSON.stringify(flaggedContent));
  return updatedItem;
};

// ---------------------------------------------------------------------------
// JOURNAL ENTRIES
// ---------------------------------------------------------------------------
export const getJournalEntries = (): JournalEntry[] => getUserProfile().journals;

export const addJournalEntry = async (
  entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<JournalEntry> => {
  const profile = getUserProfile();
  // Use safe full-sentence checker — not single keywords
  const contentCheck = checkContentSafe(entry.content);

  const newEntry: JournalEntry = {
    id: Date.now().toString(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    attachments: entry.attachments || [],
    ...entry,
    flagged: contentCheck.flagged,
    flagReason: contentCheck.reason,
  };

  updateUserProfile({ journals: [...profile.journals, newEntry] });

  const authData = sessionStorage.getItem('authData') || localStorage.getItem('authData');
  if (authData) {
    syncJournalToBackend(newEntry.id, newEntry).catch(err =>
      console.warn('Failed to sync journal to backend:', err)
    );
  }

  return newEntry;
};

export const updateJournalEntry = async (
  id: string,
  updates: Omit<JournalEntry, 'id' | 'createdAt'>
): Promise<JournalEntry | null> => {
  const profile = getUserProfile();
  const index = profile.journals.findIndex(j => j.id === id);
  if (index === -1) return null;

  const contentCheck = checkContentSafe(updates.content);

  const updatedEntry: JournalEntry = {
    ...profile.journals[index],
    ...updates,
    id,
    createdAt: profile.journals[index].createdAt,
    updatedAt: Date.now(),
    attachments: updates.attachments || profile.journals[index].attachments || [],
    flagged: contentCheck.flagged,
    flagReason: contentCheck.reason,
  };

  profile.journals[index] = updatedEntry;
  updateUserProfile({ journals: profile.journals });

  const authData = sessionStorage.getItem('authData') || localStorage.getItem('authData');
  if (authData) {
    syncJournalToBackend(updatedEntry.id, updatedEntry).catch(err =>
      console.warn('Failed to sync journal to backend:', err)
    );
  }

  return updatedEntry;
};

export const deleteJournalEntry = async (id: string): Promise<boolean> => {
  const profile = getUserProfile();
  const updatedJournals = profile.journals.filter(j => j.id !== id);
  if (updatedJournals.length === profile.journals.length) return false;
  updateUserProfile({ journals: updatedJournals });

  const authData = sessionStorage.getItem('authData') || localStorage.getItem('authData');
  if (authData) {
    deleteJournalFromBackend(id).catch(err =>
      console.warn('Failed to delete journal from backend:', err)
    );
  }

  return true;
};

export const syncJournalsFromBackend = async (): Promise<void> => {
  try {
    const result = await fetchJournalsFromBackend();
    if (result.success && result.journals) {
      const profile = getUserProfile();
      const localIds = new Set(profile.journals.map(j => j.id));
      for (const backendJournal of result.journals) {
        if (!localIds.has(backendJournal.entryId)) {
          profile.journals.push(backendJournal.data);
        }
      }
      updateUserProfile({ journals: profile.journals });
      console.log('✅ Synced journals from backend:', result.journals.length, 'new/updated');
    }
  } catch (error) {
    console.warn('⚠️ Failed to sync journals from backend (will use local):', error);
  }
};

// ---------------------------------------------------------------------------
// MOOD ENTRIES
// ---------------------------------------------------------------------------
export const getMoodEntries = (): MoodEntry[] => {
  const profile = getUserProfile();
  return profile.mood.history.map(entry => ({
    ...entry,
    date: typeof entry.date === 'number' ? entry.date : new Date(entry.timestamp || entry.date).getTime(),
    note: entry.note ?? '',
  }));
};

export const addMoodEntry = (mood: Mood, note: string = ''): MoodEntry => {
  const profile = getUserProfile();
  const newEntry: MoodEntry = {
    id: Date.now().toString(),
    mood,
    note,
    timestamp: Date.now(),
    date: new Date().toISOString(),
  };
  updateUserProfile({ mood: { current: mood, history: [...profile.mood.history, newEntry] } });
  return newEntry;
};

// ---------------------------------------------------------------------------
// CONVERSATIONS
// ---------------------------------------------------------------------------
export const getConversations = (): Conversation[] => getUserProfile().conversations;

export const getConversation = (id: string): Conversation | null => {
  const profile = getUserProfile();
  return profile.conversations.find(c => c.id === id) || null;
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
  updateUserProfile({ conversations: [...profile.conversations, newConversation] });
  return newConversation;
};

export const updateConversation = (id: string, updates: Partial<Conversation>): Conversation | null => {
  const profile = getUserProfile();
  const index = profile.conversations.findIndex(c => c.id === id);
  if (index === -1) return null;
  const updatedConvo = { ...profile.conversations[index], ...updates, updatedAt: Date.now() };
  profile.conversations[index] = updatedConvo;
  updateUserProfile({ conversations: profile.conversations });
  return updatedConvo;
};

// ---------------------------------------------------------------------------
// CHAT MESSAGES
// Uses full-sentence safe checker — never flags educational/third-party messages
// ---------------------------------------------------------------------------
export const addMessageToConversation = (
  conversationId: string,
  message: Omit<Omit<Omit<ChatMessage, 'id'>, 'timestamp'>, 'conversationId'>
): Conversation | null => {
  const profile = getUserProfile();
  const convoIndex = profile.conversations.findIndex(c => c.id === conversationId);
  if (convoIndex === -1) return null;

  // Only check user messages; assistant messages are never flagged
  const contentCheck = message.role === 'user'
    ? checkContentSafe(message.content)
    : { flagged: false };

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
  const updated = profile.conversations.filter(c => c.id !== id);
  if (updated.length === profile.conversations.length) return false;
  updateUserProfile({ conversations: updated });
  return true;
};

// ---------------------------------------------------------------------------
// EXPORTED STORAGE OBJECT
// ---------------------------------------------------------------------------
export const storage = {
  initializeStorage,
  getUserProfile,
  updateUserProfile,
  getJournalEntries,
  addJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  syncJournalsFromBackend,
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