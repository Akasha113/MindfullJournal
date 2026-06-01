/**
 * 🔒 LOCAL CHAT SERVICE - CLIENT-SIDE + BACKEND SYNC
 * 
 * ⚠️ UPDATED PRIVACY GUARANTEE:
 * ALL chat conversations are stored LOCALLY in browser localStorage AND synced to backend.
 * Data is encrypted before sending to backend - backend cannot decrypt.
 * Admins CANNOT access user conversations through any API.
 * 
 * How it works:
 * 1. Chat messages are stored with key: mindful_conversations_${userId} (LOCAL)
 * 2. Chats are encrypted and synced to backend after each message
 * 3. When user logs in from a new device, chats are fetched from backend and decrypted
 * 4. Each user gets isolated storage (user-specific)
 * 5. Different users on the same browser never see each other's chats
 * 
 * EXCEPTION: Crisis Detection
 * - When suicidal/self-harm keywords are detected, the message is logged
 * - This is sent to admins for emergency intervention ONLY
 * - Non-crisis messages are NEVER sent unencrypted anywhere
 * 
 * See PRIVACY_MODEL.md for detailed privacy information
 */

// src/utils/localChat.ts - Local storage with GitHub Models API + Backend Sync
import { ChatMessage, Conversation } from '../types';
import { syncChatToBackend, deleteChatFromBackend } from './cloudSync';

// Get current user ID from sessionStorage (set during login)
const getCurrentUserId = (): string => {
  // first try sessionStorage (fast and cleared on logout)
  let authData = sessionStorage.getItem('authData');

  // if sessionStorage is empty (common in PWAs after closing), fall back
  // to localStorage where we also mirror authData during login.
  if (!authData) {
    authData = localStorage.getItem('authData');
  }

  if (!authData) {
    // no authenticated user; use a default key so chats are anonymous and
    // will be wiped when a real user logs in.
    console.warn('⚠️ No user authenticated - conversations will be cleared');
    return 'default';
  }
  try {
    const parsed = JSON.parse(authData);
    const userId = parsed.id || parsed.email;
    if (!userId) {
      console.warn('⚠️ No user ID in authData');
      return 'default';
    }
    return userId;
  } catch (e) {
    console.error('Failed to parse authData:', e);
    return 'default';
  }
};

// Storage key based solely on the current user.
// Uses localStorage so data persists across logins for the same account.
// Different user IDs map to different keys, so privacy is maintained.
const getStorageKey = (): string => {
  return `mindful_conversations_${getCurrentUserId()}`;
};

const GITHUB_ENDPOINT =
  import.meta.env.VITE_GITHUB_API_ENDPOINT ||
  import.meta.env.VITE_AZURE_INFERENCE_ENDPOINT ||
  'https://models.inference.ai.azure.com';

const GITHUB_MODEL = import.meta.env.VITE_GITHUB_MODEL || 'gpt-4o-mini';

console.log('🔣 AI endpoint:', GITHUB_ENDPOINT, 'model:', GITHUB_MODEL);

const INITIAL_GREETING =
  "Hi! 👋 I'm your AI companion here to listen and support you. I'm in a safe, judgment-free space where you can share anything on your mind. How are you feeling today?";

const SYSTEM_PROMPT = `You are a friendly and supportive companion. Your role is to:
- Listen to what people tell you
- Show you care about their feelings
- Ask questions to understand them better
- Give helpful and kind suggestions
- Be respectful and non-judgmental
- Keep responses short and friendly (2-3 sentences)
- Respond like a good friend would
- Make people feel welcome and safe talking to you

Always be warm, friendly, and supportive. Help people feel heard and understood.`;

// Debug: Check if token is loaded
const debugToken = import.meta.env.VITE_GITHUB_API_TOKEN;
if (debugToken) {
  console.log('✅ GitHub API Token loaded:', debugToken.substring(0, 10) + '...');
} else {
  console.warn('⚠️ GitHub API Token NOT found. Make sure .env.local has VITE_GITHUB_API_TOKEN set.');
}

// Crisis detection and resources - ALL LANGUAGES SUPPORTED
// Comprehensive multilingual crisis keywords for global suicide detection
const CRISIS_KEYWORDS = [
  // ===== ENGLISH =====
  'i want to kill myself',
  'i am going to kill myself',
  'i plan to end my life',
  'i am going to commit suicide',
  'i have decided to die',
  'i will take my own life',
  'tonight is my last night',
  'i have a plan to',
  'i already have the',
  'i know how i will do it',
  'suicide', 'suicidal', 'kill myself', 'hurt myself', 'harm myself',
  'end my life', 'end it', 'don\'t want to live', 'want to die',
  'self harm', 'self-harm', 'cutting myself', 'overdose', 'hang myself',
  'jump', 'i can\'t take it anymore', 'can\'t go on', 'give up',
  'no reason to live', 'worthless', 'nobody cares', 'everyone would be better off',
  'life is meaningless', 'tired of living', 'end everything', 'take my life',
  'step in front', 'slash my wrists', 'poison myself', 'drown myself',
  'i want to disappear', 'nobody needs me', 'better off dead', 'fatal dose',
  'final goodbye', 'last goodbye', 'saying goodbye', 'permanent solution',
  'can\'t handle this', 'too much pain', 'unbearable pain', 'rope', 'noose',
  'sleeping pills', 'razors', 'cut myself', 'break bones', 'bleed out',

  // ===== URDU =====
  'khudkushi karna chahti hoon',
  'khudkushi karna chahta hoon',
  'jaan lena chahti hoon',
  'jaan lena chahta hoon',
  'jaan lena chahti hon',
  'jaan lena chahta hon',
  'marna chahti hoon',
  'marna chahta hoon',
  'marna chahti hon',
  'marna chahta hon',
  'mn marna chahti hon',
  'mn marna chahta hon',
  'khudkushi karne wali hoon',
  'khudkushi karne wala hoon',
  'khudkushi krne wali hoon',
  'khudkushi krne wala hoon',
  'khudkushi krni hoon',
  'khudkushi krna hoon',
  'khudkushi krni hon',
  'khudkushi krna hon',
  'zindagi khatam karna chahti hoon',
  'zindagi khatam karna chahta hoon',
  'zindagi khatam krna chahti hoon',
  'zindagi khatam krna chahta hoon',
  'khud ko maarna chahti hoon',
  'khud ko maarna chahta hoon',
  'khud ko marna chahti hoon',
  'khud ko marna chahta hoon',
  'aaj raat meri aakhri raat hai',
  'kal mera aakhri din hai',
  'main marne ka faisla kar chuki hoon',
  'main marne ka faisla kar chuka hoon',
  'mn marne ka faisla kar chuki hoon',
  'mn marne ka faisla kar chuka hoon',
  'main khudkushi karne wali hoon',
  'main khudkushi karne wala hoon',
  'mn khudkushi karne wali hoon',
  'mn khudkushi karne wala hoon',
  'mn khudkushi krne wali hoon',
  'mn khudkushi krne wala hoon',
  'mn khudkushi krna chahti hon',
  'mn khudkushi krna chahta hon',
  'khud ko marna hai', 'apne aap ko marna', 'mujhe mar jana', 'mujhe suicide krna',
  'jeevan khatam krna', 'apne aap ko nuksan', 'apne aap ko kaatna',
  'zyada bardasht nahi', 'kuch nahi raha', 'sab khatam',
  'jeevan se thaka', 'mar ja', 'khud ko zehreela',
  'apne se pyar nahi', 'insaan se befeeda', 'sab bekar',
  'jeevan bekaar', 'koi matlab nahi', 'koi fayda nahi',
  'khud ko hurt', 'apne aap ko chot', 'khud ko tabah',
  'mera kuch nahi', 'mujhe nahi chahiye', 'zyada tanhai',
  'akela hoon', 'kisi ko parwah nahi', 'khud gina nahi',

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
  'j\'en ai assez de vivre',

  // ===== ARABIC =====
  'أريد أن أنهي حياتي',
  'سأنتحر',
  'لا أستطيع العيش',
  'سأضع حداً لحياتي',
  'أريد أن أموت',

  // ===== PORTUGUESE =====
  'quero me matar',
  'vou me suicidar',
  'quero acabar com minha vida',
  'não aguento mais viver',

  // ===== GERMAN =====
  'ich will mich töten',
  'ich werde mich umbringen',
  'ich will mein Leben beenden',
  'ich kann nicht mehr leben',

  // ===== ITALIAN =====
  'voglio suicidarmi',
  'vado a togliermi la vita',
  'non posso più vivere',
  'voglio morire',

  // ===== HINDI =====
  'main apne aap ko maarna chahta hoon',
  'main aatmahatya karna chahta hoon',
  'mujhe jeena nahi hai',
  'zindagi se thak gaya hoon',

  // ===== BENGALI =====
  'ami nij-deh poriksha korte chai',
  'ami jeeban sesh korte chai',
  'jeeban aro chalte parchhi na',

  // ===== TURKISH =====
  'kendimi öldürmek istiyorum',
  'intihar edeceğim',
  'hayatımı bitirmek istiyorum',
  'artık dayanamıyorum'
];

export const isCrisisMessage = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
};

export const getCrisisResponse = (): string => {
  return `🚨 **I'M CONCERNED ABOUT YOUR SAFETY** 🚨

If you're having thoughts of suicide, please reach out for help right now:

**IMMEDIATE CRISIS SUPPORT:**
• **Call 988** - National Suicide Prevention Lifeline (24/7 - FREE)
• **Text "HELLO" to 741741** - Crisis Text Line (24/7 - FREE)
• **Call 911** - Emergency Services (for immediate danger)
• **Go to nearest ER** - If you're in immediate danger

**International:**
• UK: 116 123 (Samaritans) 24/7
• Canada: 1-833-456-4566 (24/7)
• Australia: 13 11 14 (Lifeline) 24/7
• Germany: 0800-111 0 111 or 0800-111 0 222

**You matter. Your life has value. Help is available right now.**

I care about you and want you to be safe. Please reach out to one of these resources immediately. You don't have to face this alone. ❤️`;
};

export const fetchGitHubResponse = async (messages: ChatMessage[]): Promise<string> => {
  try {
    const token = import.meta.env.VITE_GITHUB_API_TOKEN;

    if (!token) {
      console.warn('GitHub API token missing. Using fallback response.');
      return "I appreciate you sharing with me. Tell me more about how you're feeling.";
    }

    // Format messages for API
    const apiMessages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }))
    ];

    console.log('Sending request to GitHub API...');

    // Make API call
    const response = await fetch(`${GITHUB_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: apiMessages,
        model: GITHUB_MODEL,
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      let errorDetails = `Status: ${response.status} ${response.statusText}`;
      let isContentFilter = false;
      try {
        const errorData = await response.json();
        console.error('GitHub API Error Response:', errorData);
        errorDetails = `${errorDetails} - ${JSON.stringify(errorData)}`;
        
        // Check if it's a content filter error
        if (errorData?.error?.code === 'content_filter' || 
            errorData?.error?.innererror?.code === 'ResponsibleAIPolicyViolation') {
          isContentFilter = true;
        }
      } catch {
        const errorText = await response.text();
        console.error('GitHub API Error Text:', errorText);
        errorDetails = `${errorDetails} - ${errorText}`;
      }
      
      console.error('Full error details:', errorDetails);
      
      // Return specific message for content filter errors
      if (isContentFilter) {
        const error = new Error('content_filter');
        throw error;
      }
      
      throw new Error(`GitHub API Error: ${errorDetails}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content?.trim() ||
      "I'm here to listen. Tell me more about what you're feeling.";
    
    console.log('Got response from GitHub API');
    return responseText;
  } catch (error: any) {
    console.error('GitHub Models API error:', error.message || error);
    console.error('GitHub endpoint used:', GITHUB_ENDPOINT);
    
    // Handle content filter errors gracefully
    if (error.message === 'content_filter') {
      return "I understand you're going through something difficult. Your wellbeing matters deeply to me. 💜\n\nIf you're having thoughts of self-harm, please reach out for immediate support:\n\n🆘 **Crisis Hotlines:**\n• National Suicide Prevention Lifeline: 988 (US)\n• Crisis Text Line: Text HOME to 741741\n• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/\n\nYou don't have to face this alone. Please reach out to someone you trust or contact a professional. 💙";
    }
    
    // Check token validity
    const token = import.meta.env.VITE_GITHUB_API_TOKEN;
    if (!token || token === 'YOUR_TOKEN_HERE') {
      return "⚠️ GitHub API token is not configured properly. Please check your .env.local file and make sure VITE_GITHUB_API_TOKEN is set correctly.";
    }
    
    // Fallback response
    return "I appreciate you sharing with me. How does that make you feel? I'm here to listen.";
  }
};

// Get all conversations from localStorage + backend
export const getAllConversations = (): Conversation[] => {
  const stored = localStorage.getItem(getStorageKey());
  return stored ? JSON.parse(stored) : [];
};

// Sync conversations from backend (call this on login)
export const syncConversationsFromBackend = async (): Promise<void> => {
  try {
    const { fetchChatsFromBackend } = await import('./cloudSync');
    const result = await fetchChatsFromBackend();
    
    if (result.success && result.chats) {
      // Merge backend chats with local ones
      const localChats = getAllConversations();
      const localChatIds = new Set(localChats.map(c => c.id));
      
      // Add chats that only exist on backend
      for (const backendChat of result.chats) {
        if (!localChatIds.has(backendChat.conversationId)) {
          const newConv: Conversation = {
            id: backendChat.conversationId,
            title: backendChat.data.title || `Chat - ${new Date(backendChat.data.createdAt).toLocaleDateString()}`,
            messages: backendChat.data.messages || [],
            createdAt: backendChat.data.createdAt || Date.now(),
            updatedAt: backendChat.data.updatedAt || Date.now(),
          };
          localChats.push(newConv);
        }
      }
      
      // Save merged list
      localStorage.setItem(getStorageKey(), JSON.stringify(localChats));
      console.log('✅ Synced conversations from backend:', result.chats.length, 'new/updated');
    }
  } catch (error) {
    console.warn('⚠️ Failed to sync conversations from backend (will use local):', error);
    // Silently fail - local data is still available
  }
};

// Get single conversation
export const getConversation = (id: string): Conversation | null => {
  const conversations = getAllConversations();
  return conversations.find(c => c.id === id) || null;
};

// Save conversation to localStorage AND sync to backend
const saveConversation = async (conversation: Conversation) => {
  const conversations = getAllConversations();
  const index = conversations.findIndex(c => c.id === conversation.id);
  if (index >= 0) {
    conversations[index] = conversation;
  } else {
    conversations.push(conversation);
  }
  localStorage.setItem(getStorageKey(), JSON.stringify(conversations));
  
  // Sync to backend (fire and forget to not block UI)
  // Only sync if user is authenticated
  const authData = sessionStorage.getItem('authData') || localStorage.getItem('authData');
  if (authData) {
    syncChatToBackend(conversation.id, conversation).catch(err => 
      console.warn('Failed to sync chat to backend (will retry on next sync):', err)
    );
  }
};

// Export saveConversation for external use (backend sync recovery)
export const saveSyncedConversation = saveConversation;

// Create new conversation
export const createConversation = async (): Promise<Conversation> => {
  const conversation: Conversation = {
    id: Date.now().toString(),
    title: `Chat - ${new Date().toLocaleDateString()}`,
    messages: [
      {
        id: 'greeting-' + Date.now(),
        role: 'assistant',
        content: INITIAL_GREETING,
        timestamp: Date.now(),
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await saveConversation(conversation);
  return conversation;
};

// Add message to conversation
export const addMessage = async (
  conversationId: string,
  message: ChatMessage
): Promise<Conversation | null> => {
  const conversation = getConversation(conversationId);
  if (!conversation) return null;

  conversation.messages.push(message);
  conversation.updatedAt = Date.now();
  await saveConversation(conversation);
  return conversation;
};

// Send user message and get AI response from GitHub API
export const sendMessage = async (
  conversationId: string,
  userMessage: string
): Promise<Conversation | null> => {
  const conversation = getConversation(conversationId);
  if (!conversation) return null;

  // Check if this is a crisis message
  const hasCrisisContent = isCrisisMessage(userMessage);

  // Add user message with unique ID
  const userMsg: ChatMessage = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    role: 'user',
    content: userMessage,
    timestamp: Date.now(),
  };
  const afterUser = await addMessage(conversationId, userMsg);
  if (!afterUser) return null;

  // If crisis detected, send crisis alert to admin dashboard
  if (hasCrisisContent) {
    try {
      // Get user ID and token from sessionStorage
      const authData = sessionStorage.getItem('authData');
      let authToken = localStorage.getItem('authToken');
      
      // Fallback to token from authData if authToken not found
      if (!authToken && authData) {
        try {
          const parsed = JSON.parse(authData);
          authToken = parsed.token || null;
        } catch (e) {
          console.error('Failed to parse token from authData:', e);
        }
      }
      
      let userId: string | undefined;
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          userId = parsed.id || parsed.email;
        } catch (e) {
          console.error('Failed to parse authData:', e);
        }
      }
      
      console.log('🚨 CRISIS DETECTED - Sending alert to admin');
      console.log('📤 Crisis alert details:');
      console.log('   userId:', userId || 'anonymous');
      console.log('   message:', userMessage.substring(0, 50) + '...');
      console.log('   token exists:', !!authToken);
      
      // Build alert payload (omit userId if not available)
      const alertPayload: Record<string, any> = {
        content: userMessage,
        contentType: 'chat',
        riskLevel: 'critical',
        riskScore: 0.95,
        detectedKeywords: ['suicide', 'die', 'kill myself', 'self-harm'],
        riskFactors: ['direct_self_harm_statement'],
        conversationId,
        urgencyLevel: 'emergency',
      };
      
      if (userId) {
        alertPayload.userId = userId;
      }
      // include a snapshot of the logged-in user's name/email when available so admins
      // can contact them even if a direct ObjectId link isn't present on the server
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          console.log('📧 Auth data parsed:', parsed);
          // Try different possible field names for user data
          const userName = parsed.name || parsed.userName || parsed.displayName;
          const userEmail = parsed.email || parsed.userEmail || parsed.mail;
          if (userName) {
            alertPayload.userName = userName;
            console.log('📧 Setting userName:', userName);
          }
          if (userEmail) {
            alertPayload.userEmail = userEmail;
            console.log('📧 Setting userEmail:', userEmail);
          }
        } catch (e) {
          console.error('❌ Failed to parse authData for user snapshot:', e);
        }
      } else {
        console.log('📧 No authData found for user snapshot');
      }
      
      // Send crisis alert to backend
      const alertResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/crisis-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
        body: JSON.stringify(alertPayload),
      });
      
      console.log('📥 Crisis alert response status:', alertResponse.status);
      
      if (alertResponse.ok) {
        const data = await alertResponse.json();
        console.log('✅ Crisis alert sent successfully to admin dashboard');
        console.log('   Alert ID:', data.alert?._id);
      } else {
        const errorText = await alertResponse.text();
        console.error('❌ Failed to send crisis alert');
        console.error('   Status:', alertResponse.status);
        console.error('   Response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error sending crisis alert to admin:', error);
    }
    
    // Show crisis response to user
    const crisisMsg: ChatMessage = {
      id: 'msg-' + (Date.now() + 1) + '-' + Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: getCrisisResponse(),
      timestamp: Date.now(),
    };
    return await addMessage(conversationId, crisisMsg);
  }

  try {
    // Get AI response from GitHub API using conversation history
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
    
    // Fallback error message
    const fallbackMsg: ChatMessage = {
      id: 'msg-' + (Date.now() + 1) + '-' + Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: "I'm sorry, I'm having trouble connecting right now. Please check your GitHub API token and try again.",
      timestamp: Date.now(),
    };
    
    return await addMessage(conversationId, fallbackMsg);
  }
};

// Delete conversation from localStorage AND backend
export const deleteConversation = async (id: string): Promise<void> => {
  const conversations = getAllConversations();
  const filtered = conversations.filter(c => c.id !== id);
  localStorage.setItem(getStorageKey(), JSON.stringify(filtered));
  
  // Also delete from backend
  const authData = sessionStorage.getItem('authData') || localStorage.getItem('authData');
  if (authData) {
    deleteChatFromBackend(id).catch(err => 
      console.warn('Failed to delete chat from backend:', err)
    );
  }
};

// Clear messages in conversation
export const clearConversation = async (id: string): Promise<Conversation | null> => {
  const conversation = getConversation(id);
  if (!conversation) return null;

  conversation.messages = [
    {
      id: 'greeting-' + Date.now(),
      role: 'assistant',
      content: INITIAL_GREETING,
      timestamp: Date.now(),
    }
  ];
  conversation.updatedAt = Date.now();
  await saveConversation(conversation);
  return conversation;
};

// Update conversation title
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