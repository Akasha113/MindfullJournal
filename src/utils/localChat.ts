/**
 * 🔒 LOCAL CHAT SERVICE - CLIENT-SIDE + BACKEND SYNC
 *
 * CRISIS DETECTION RULES:
 * 1. Informational queries ("what is suicide", "why do people commit suicide") → normal AI response, no crisis
 * 2. Third-party messages ("my friend wants to die") → empathy only, NO crisis resources
 * 3. First-person explicit full-sentence crisis statements → crisis response + admin alert
 * 4. Single words like "suicide" alone → normal response, no crisis triggered
 * 5. Requests for methods on how to do suicide → redirect without providing methods
 */

import { ChatMessage, Conversation } from '../types';
import { syncChatToBackend, deleteChatFromBackend } from './cloudSync';
import { isAboutSelf, isInformationalQuery } from './enhancedSuicideDetection';

// ---------------------------------------------------------------------------
// AUTH HELPERS
// ---------------------------------------------------------------------------
const getCurrentUserId = (): string => {
  let authData = sessionStorage.getItem('authData');
  if (!authData) authData = localStorage.getItem('authData');
  if (!authData) {
    console.warn('⚠️ No user authenticated - conversations will be cleared');
    return 'default';
  }
  try {
    const parsed = JSON.parse(authData);
    const userId = parsed.id || parsed.email;
    if (!userId) { console.warn('⚠️ No user ID in authData'); return 'default'; }
    return userId;
  } catch (e) {
    console.error('Failed to parse authData:', e);
    return 'default';
  }
};

const getStorageKey = (): string => `mindful_conversations_${getCurrentUserId()}`;

// ---------------------------------------------------------------------------
// AI ENDPOINT CONFIG
// ---------------------------------------------------------------------------
const GITHUB_ENDPOINT =
  import.meta.env.VITE_GITHUB_API_ENDPOINT ||
  import.meta.env.VITE_AZURE_INFERENCE_ENDPOINT ||
  'https://models.inference.ai.azure.com';

const GITHUB_MODEL = import.meta.env.VITE_GITHUB_MODEL || 'gpt-4o-mini';

console.log('🔣 AI endpoint:', GITHUB_ENDPOINT, 'model:', GITHUB_MODEL);

// ---------------------------------------------------------------------------
// PROMPTS
// ---------------------------------------------------------------------------
const INITIAL_GREETING =
  "Hi! 👋 I'm your AI companion here to listen and support you. I'm in a safe, judgment-free space where you can share anything on your mind. How are you feeling today?";

const SYSTEM_PROMPT = `You are a friendly and supportive mental-health companion. Your role is to:
- Listen to what people tell you
- Show you care about their feelings
- Ask questions to understand them better
- Give helpful and kind suggestions
- Be respectful and non-judgmental
- Keep responses short and friendly (2-3 sentences)
- Respond like a good friend would
- Make people feel welcome and safe talking to you
- If someone asks about suicide or self-harm in an educational/informational way, respond with factual, empathetic information without providing specific methods.
- If someone asks HOW to perform self-harm or suicide methods, gently redirect them to professional help without providing any method details.
- Only offer emergency hotlines when the person is CLEARLY describing their OWN immediate suicidal or self-harm intent with explicit first-person statements.
- If someone is talking about another person struggling, help them support that person without treating it as the user's own crisis.

Always be warm, friendly, and supportive. Help people feel heard and understood.`;

// ---------------------------------------------------------------------------
// CRISIS KEYWORD LIST — FULL SENTENCES ONLY (no single words)
// ---------------------------------------------------------------------------
const CRISIS_KEYWORDS = [
  // ===== ENGLISH — first-person explicit =====
  'i want to kill myself',
  'i am going to kill myself',
  'i plan to end my life',
  'i will take my own life',
  'i have decided to die',
  'tonight is my last night',
  'i have a plan to end my life',
  'i know how i will do it',
  'i want to overdose',
  'i am suicidal',
  'i feel suicidal',
  'i want to die',
  "i don't want to live",
  "i don't want to be alive",
  'i want to end my life',
  'i want to harm myself',
  'i want to hurt myself',
  'i am cutting myself',
  'i cut myself',
  'i want to cut myself',
  'i want to jump off',
  'i am going to jump',
  "i can't go on",
  'i give up on living',
  'i have no reason to live',
  'i feel worthless and want to die',
  'everyone would be better off without me',
  'i am tired of living',
  'i want to take my life',
  'this is my final goodbye',
  'the pain is unbearable and i want to die',
  'i will hang myself',
  'i will poison myself',
  'i want to bleed out',
  'i want to disappear forever',
  'i wish i was dead',
  'i wish i were dead',
  'nothing to live for',
  'i want to stop existing',
  'life is not worth living',
  'i have made up my mind to die',
  'i will end my suffering',

  // ===== URDU =====
  'khudkushi karna chahti hoon',
  'khudkushi karna chahta hoon',
  'jaan lena chahti hoon',
  'jaan lena chahta hoon',
  'marna chahti hoon',
  'marna chahta hoon',
  'mn marna chahti hon',
  'mn marna chahta hon',
  'khudkushi karne wali hoon',
  'khudkushi karne wala hoon',
  'zindagi khatam karna chahti hoon',
  'zindagi khatam karna chahta hoon',
  'khud ko maarna chahti hoon',
  'khud ko maarna chahta hoon',
  'khud ko marna chahti hoon',
  'khud ko marna chahta hoon',
  'aaj raat meri aakhri raat hai',
  'kal mera aakhri din hai',
  'main marne ka faisla kar chuki hoon',
  'main marne ka faisla kar chuka hoon',
  'jeena nahi chahti',
  'jeena nahi chahta',
  'mujhe marna hai',
  'zindagi se tang aa gayi hoon',
  'zindagi se tang aa gaya hoon',

  // ===== SPANISH =====
  'quiero matarme',
  'voy a suicidarme',
  'planeo terminar mi vida',
  'he decidido morir',
  'quiero acabar con esto',
  'no aguanto más la vida',

  // ===== FRENCH =====
  'je veux me tuer',
  'je vais me suicider',
  'je décide de mourir',
  'je veux mettre fin à ma vie',

  // ===== ARABIC =====
  'أريد أن أنهي حياتي',
  'سأنتحر',
  'أريد أن أموت',

  // ===== PORTUGUESE =====
  'quero me matar',
  'vou me suicidar',
  'quero acabar com minha vida',

  // ===== GERMAN =====
  'ich will mich töten',
  'ich werde mich umbringen',
  'ich will mein Leben beenden',

  // ===== ITALIAN =====
  'voglio suicidarmi',
  'vado a togliermi la vita',
  'voglio morire',

  // ===== HINDI =====
  'main apne aap ko maarna chahta hoon',
  'main aatmahatya karna chahta hoon',
  'mujhe jeena nahi hai',

  // ===== BENGALI =====
  'ami jeeban sesh korte chai',
  'ami morte chai',

  // ===== TURKISH =====
  'kendimi öldürmek istiyorum',
  'intihar edeceğim',
  'hayatımı bitirmek istiyorum',
];

// ---------------------------------------------------------------------------
// METHOD REQUEST DETECTION
// Detects when someone is asking HOW to do self-harm (seeking methods)
// ---------------------------------------------------------------------------
const METHOD_REQUEST_PATTERNS = [
  'how to kill myself',
  'how to commit suicide',
  'ways to kill myself',
  'ways to commit suicide',
  'best way to die',
  'easiest way to die',
  'painless way to die',
  'how to end my life',
  'methods of suicide',
  'suicide methods',
  'how to overdose',
  'how to hang myself',
  'how to cut myself',
  'how to harm myself',
  'how do i kill myself',
  'how do people kill themselves',
  'what pills to take to die',
  'what is the best method',
  // Urdu
  'khudkushi kaise karte hain',
  'khudkushi ka tarika',
  'marne ka tarika',
  'jaan kaise loon',
  // Spanish
  'cómo suicidarme',
  'maneras de suicidarse',
  // French
  'comment se suicider',
  'méthodes de suicide',
  // German
  'wie töte ich mich',
  'wie bringe ich mich um',
  // Arabic
  'كيف أنتحر',
  'طرق الانتحار',
];

// ---------------------------------------------------------------------------
// DETECTION HELPERS
// ---------------------------------------------------------------------------

/**
 * Returns true if the message is someone asking HOW to perform self-harm.
 * These get a gentle redirect — no methods provided.
 */
const isMethodRequest = (message: string): boolean => {
  const lower = message.toLowerCase();
  return METHOD_REQUEST_PATTERNS.some(p => lower.includes(p));
};

/**
 * Returns true ONLY for explicit first-person crisis statements (full sentences).
 * Single words, educational questions, and third-party mentions all return false.
 */
export const isCrisisMessage = (message: string): boolean => {
  // Informational / educational queries are never a crisis
  if (isInformationalQuery(message)) return false;
  // Must be about the user themselves
  if (!isAboutSelf(message)) return false;

  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lower.includes(keyword));
};

/**
 * Returns true when the user is reporting someone ELSE in crisis.
 * We provide empathy to the user — NOT crisis resources for the third party.
 */
const isThirdPartyCrisisMention = (message: string): boolean => {
  if (isInformationalQuery(message)) return false;
  if (isAboutSelf(message)) return false; // already handled as self-crisis

  const lower = message.toLowerCase();
  // Check for any crisis keyword appearing in a third-party context
  return CRISIS_KEYWORDS.some(keyword => lower.includes(keyword));
};

// ---------------------------------------------------------------------------
// RESPONSE BUILDERS
// ---------------------------------------------------------------------------

/** Shown when user reports someone else is in crisis. Empathy only — no hotlines. */
const getThirdPartySupportResponse = (): string =>
  `I'm sorry to hear that someone you know is struggling. It can feel overwhelming when someone close to you is in pain.

If you're worried about them, the most important thing is to encourage them to reach out to a trusted friend, family member, or mental health professional. Staying connected with them and listening without judgment can make a real difference.

I'm here to listen to how *you're* feeling about this situation. How are you coping with what you're seeing?`;

/** Shown when user asks HOW to perform self-harm — redirect without methods. */
const getMethodRedirectResponse = (): string =>
  `I can hear that you're in a lot of pain right now, and I'm really concerned about you. I'm not able to share information on ways to hurt yourself — but I genuinely want to help you through what you're feeling.

**Please reach out to someone who can support you right now:**
• **Call or text 988** — Suicide & Crisis Lifeline (US, 24/7, free)
• **Text "HELLO" to 741741** — Crisis Text Line (24/7)
• **International resources:** https://www.iasp.info/resources/Crisis_Centres/

You don't have to carry this alone. Can you tell me more about what's brought you to this point? I'm here to listen. ❤️`;

/** Shown for confirmed first-person crisis statements. */
export const getCrisisResponse = (): string =>
  `🚨 **I'M CONCERNED ABOUT YOUR SAFETY** 🚨

What you've shared tells me you're in a lot of pain right now. Please reach out for help immediately — you deserve support.

**IMMEDIATE CRISIS SUPPORT:**
• **Call or text 988** — Suicide & Crisis Lifeline (US, 24/7 – FREE)
• **Text "HELLO" to 741741** — Crisis Text Line (24/7 – FREE)
• **Call 911** — If you are in immediate danger
• **Go to your nearest ER** — If you need immediate help

**International:**
• UK: 116 123 (Samaritans) 24/7
• Canada: 1-833-456-4566 (24/7)
• Australia: 13 11 14 (Lifeline) 24/7
• Pakistan: 0311-7786264 (Umang)
• India: iCall 9152987821

**You matter. Your life has value. Help is available right now.**

Please reach out to one of these resources. You don't have to face this alone. ❤️`;

// ---------------------------------------------------------------------------
// GITHUB / AZURE AI CALL
// ---------------------------------------------------------------------------
export const fetchGitHubResponse = async (messages: ChatMessage[]): Promise<string> => {
  try {
    const token = import.meta.env.VITE_GITHUB_API_TOKEN;
    if (!token) {
      console.warn('GitHub API token missing. Using fallback response.');
      return "I appreciate you sharing with me. Tell me more about how you're feeling.";
    }

    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
    ];

    const response = await fetch(`${GITHUB_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages, model: GITHUB_MODEL, temperature: 0.7, max_tokens: 512 }),
    });

    if (!response.ok) {
      let isContentFilter = false;
      try {
        const errorData = await response.json();
        if (errorData?.error?.code === 'content_filter' || errorData?.error?.innererror?.code === 'ResponsibleAIPolicyViolation') {
          isContentFilter = true;
        }
      } catch { /* ignore */ }
      if (isContentFilter) throw new Error('content_filter');
      throw new Error(`GitHub API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "I'm here to listen. Tell me more about what you're feeling.";
  } catch (error: any) {
    if (error.message === 'content_filter') {
      return "I understand you're going through something difficult. Your wellbeing matters deeply to me. 💜\n\nIf you're having thoughts of self-harm, please reach out:\n\n🆘 **988** (US Crisis Lifeline) or text HOME to **741741**\n\nYou don't have to face this alone. 💙";
    }
    return "I appreciate you sharing with me. How does that make you feel? I'm here to listen.";
  }
};

// ---------------------------------------------------------------------------
// LOCAL STORAGE HELPERS
// ---------------------------------------------------------------------------
export const getAllConversations = (): Conversation[] => {
  const stored = localStorage.getItem(getStorageKey());
  return stored ? JSON.parse(stored) : [];
};

export const syncConversationsFromBackend = async (): Promise<void> => {
  try {
    const { fetchChatsFromBackend } = await import('./cloudSync');
    const result = await fetchChatsFromBackend();
    if (result.success && result.chats) {
      const localChats = getAllConversations();
      const localChatIds = new Set(localChats.map((c: Conversation) => c.id));
      for (const backendChat of result.chats) {
        if (!localChatIds.has(backendChat.conversationId)) {
          localChats.push({
            id: backendChat.conversationId,
            title: backendChat.data.title || `Chat - ${new Date(backendChat.data.createdAt).toLocaleDateString()}`,
            messages: backendChat.data.messages || [],
            createdAt: backendChat.data.createdAt || Date.now(),
            updatedAt: backendChat.data.updatedAt || Date.now(),
          });
        }
      }
      localStorage.setItem(getStorageKey(), JSON.stringify(localChats));
    }
  } catch (error) {
    console.warn('⚠️ Failed to sync conversations from backend:', error);
  }
};

export const getConversation = (id: string): Conversation | null => {
  const conversations = getAllConversations();
  return conversations.find((c: Conversation) => c.id === id) || null;
};

const saveConversation = async (conversation: Conversation) => {
  const conversations = getAllConversations();
  const index = conversations.findIndex((c: Conversation) => c.id === conversation.id);
  if (index >= 0) conversations[index] = conversation;
  else conversations.push(conversation);
  localStorage.setItem(getStorageKey(), JSON.stringify(conversations));

  const authData = sessionStorage.getItem('authData') || localStorage.getItem('authData');
  if (authData) {
    syncChatToBackend(conversation.id, conversation).catch(err =>
      console.warn('Failed to sync chat to backend:', err)
    );
  }
};

export const saveSyncedConversation = saveConversation;

export const createConversation = async (): Promise<Conversation> => {
  const conversation: Conversation = {
    id: Date.now().toString(),
    title: `Chat - ${new Date().toLocaleDateString()}`,
    messages: [{
      id: 'greeting-' + Date.now(),
      role: 'assistant',
      content: INITIAL_GREETING,
      timestamp: Date.now(),
    }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await saveConversation(conversation);
  return conversation;
};

export const addMessage = async (conversationId: string, message: ChatMessage): Promise<Conversation | null> => {
  const conversation = getConversation(conversationId);
  if (!conversation) return null;
  conversation.messages.push(message);
  conversation.updatedAt = Date.now();
  await saveConversation(conversation);
  return conversation;
};

// ---------------------------------------------------------------------------
// MAIN sendMessage — orchestrates all detection logic
// ---------------------------------------------------------------------------
export const sendMessage = async (
  conversationId: string,
  userMessage: string
): Promise<Conversation | null> => {
  const conversation = getConversation(conversationId);
  if (!conversation) return null;

  // Add user message first
  const userMsg: ChatMessage = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    role: 'user',
    content: userMessage,
    timestamp: Date.now(),
  };
  const afterUser = await addMessage(conversationId, userMsg);
  if (!afterUser) return null;

  // ── BRANCH 1: Educational / informational query ──────────────────────────
  // e.g. "what is suicide?", "why do people commit suicide?", "is suicide a sin?"
  // → Send to AI normally; AI system prompt handles deflecting method requests
  if (isInformationalQuery(userMessage)) {
    try {
      const aiResponse = await fetchGitHubResponse(afterUser.messages);
      const aiMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1) + '-' + Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };
      return await addMessage(conversationId, aiMsg);
    } catch (error) {
      console.error('Error getting AI response:', error);
      return await addMessage(conversationId, {
        id: 'msg-' + (Date.now() + 1) + '-' + Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again.",
        timestamp: Date.now(),
      });
    }
  }

  // ── BRANCH 2: User asking for methods on how to harm themselves ──────────
  // e.g. "how do I kill myself", "what's the best way to die"
  // → Redirect WITHOUT providing any method information
  if (isMethodRequest(userMessage)) {
    const redirectMsg: ChatMessage = {
      id: 'msg-' + (Date.now() + 1) + '-' + Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: getMethodRedirectResponse(),
      timestamp: Date.now(),
    };
    // Also send admin alert for method requests from self
    if (isAboutSelf(userMessage)) {
      await sendCrisisAlertToAdmin(conversationId, userMessage, 'method_request');
    }
    return await addMessage(conversationId, redirectMsg);
  }

  // ── BRANCH 3: Third-party crisis mention ────────────────────────────────
  // e.g. "my friend wants to kill herself", "mera bhai marna chahta hai"
  // → Empathy for the USER; no crisis hotlines (those are for third party, not user)
  if (isThirdPartyCrisisMention(userMessage)) {
    const supportMsg: ChatMessage = {
      id: 'msg-' + (Date.now() + 1) + '-' + Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: getThirdPartySupportResponse(),
      timestamp: Date.now(),
    };
    return await addMessage(conversationId, supportMsg);
  }

  // ── BRANCH 4: First-person explicit crisis statement ────────────────────
  // e.g. "i want to kill myself", "marna chahta hoon"
  // → Show crisis resources to user AND alert admin
  if (isCrisisMessage(userMessage)) {
    await sendCrisisAlertToAdmin(conversationId, userMessage, 'direct_crisis');
    const crisisMsg: ChatMessage = {
      id: 'msg-' + (Date.now() + 1) + '-' + Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: getCrisisResponse(),
      timestamp: Date.now(),
    };
    return await addMessage(conversationId, crisisMsg);
  }

  // ── BRANCH 5: Normal conversation ───────────────────────────────────────
  try {
    const aiResponse = await fetchGitHubResponse(afterUser.messages);
    const aiMsg: ChatMessage = {
      id: 'msg-' + (Date.now() + 1) + '-' + Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now(),
    };
    return await addMessage(conversationId, aiMsg);
  } catch (error) {
    console.error('Error getting AI response:', error);
    return await addMessage(conversationId, {
      id: 'msg-' + (Date.now() + 1) + '-' + Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: "I'm sorry, I'm having trouble connecting right now. Please check your API token and try again.",
      timestamp: Date.now(),
    });
  }
};

// ---------------------------------------------------------------------------
// ADMIN ALERT HELPER
// ---------------------------------------------------------------------------
const sendCrisisAlertToAdmin = async (
  conversationId: string,
  userMessage: string,
  alertType: 'direct_crisis' | 'method_request'
) => {
  try {
    const authData = sessionStorage.getItem('authData') || localStorage.getItem('authData');
    let authToken = localStorage.getItem('authToken');
    let userId: string | undefined;
    let userName: string | undefined;
    let userEmail: string | undefined;

    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        userId = parsed.id || parsed.email;
        userName = parsed.name || parsed.userName || parsed.displayName;
        userEmail = parsed.email || parsed.userEmail || parsed.mail;
        if (!authToken) authToken = parsed.token || null;
      } catch (e) {
        console.error('Failed to parse authData:', e);
      }
    }

    const alertPayload: Record<string, any> = {
      content: userMessage,
      contentType: 'chat',
      riskLevel: 'critical',
      riskScore: 0.95,
      detectedKeywords: alertType === 'method_request' ? ['method_request', 'how_to_self_harm'] : ['suicide', 'self-harm'],
      riskFactors: alertType === 'method_request' ? ['method_seeking_behavior'] : ['direct_self_harm_statement'],
      conversationId,
      urgencyLevel: 'emergency',
    };

    if (userId) alertPayload.userId = userId;
    if (userName) alertPayload.userName = userName;
    if (userEmail) alertPayload.userEmail = userEmail;

    const alertResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/crisis-alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify(alertPayload),
    });

    if (alertResponse.ok) {
      const data = await alertResponse.json();
      console.log('✅ Crisis alert sent. Alert ID:', data.alert?._id);
    } else {
      console.error('❌ Failed to send crisis alert. Status:', alertResponse.status);
    }
  } catch (error) {
    console.error('❌ Error sending crisis alert to admin:', error);
  }
};

// ---------------------------------------------------------------------------
// CONVERSATION CRUD
// ---------------------------------------------------------------------------
export const deleteConversation = async (id: string): Promise<void> => {
  const conversations = getAllConversations();
  const filtered = conversations.filter((c: Conversation) => c.id !== id);
  localStorage.setItem(getStorageKey(), JSON.stringify(filtered));
  const authData = sessionStorage.getItem('authData') || localStorage.getItem('authData');
  if (authData) deleteChatFromBackend(id).catch(err => console.warn('Failed to delete chat from backend:', err));
};

export const clearConversation = async (id: string): Promise<Conversation | null> => {
  const conversation = getConversation(id);
  if (!conversation) return null;
  conversation.messages = [{
    id: 'greeting-' + Date.now(),
    role: 'assistant',
    content: INITIAL_GREETING,
    timestamp: Date.now(),
  }];
  conversation.updatedAt = Date.now();
  await saveConversation(conversation);
  return conversation;
};

export const updateConversationTitle = async (id: string, title: string): Promise<Conversation | null> => {
  const conversation = getConversation(id);
  if (!conversation) return null;
  conversation.title = title;
  conversation.updatedAt = Date.now();
  await saveConversation(conversation);
  return conversation;
};

export default {
  getAllConversations,
  getConversation,
  createConversation,
  addMessage,
  sendMessage,
  deleteConversation,
  clearConversation,
  updateConversationTitle,
  saveSyncedConversation,
};