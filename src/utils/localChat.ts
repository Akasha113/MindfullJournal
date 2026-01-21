// src/utils/localChat.ts - Local storage with GitHub Models API
import { ChatMessage, Conversation } from '../types';

const STORAGE_KEY = 'mindful_conversations';
const GITHUB_ENDPOINT = "https://models.inference.ai.azure.com";
const GITHUB_MODEL = "gpt-4o-mini"; // Fast model: gpt-4o-mini or gpt-4o for better quality

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

// Crisis detection and resources
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'hurt myself', 'harm myself',
  'end my life', 'end it', 'don\'t want to live', 'want to die',
  'self harm', 'self-harm', 'cutting myself', 'overdose', 'hang myself',
  'jump', 'i can\'t take it anymore', 'can\'t go on', 'give up'
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
      try {
        const errorData = await response.json();
        console.error('GitHub API Error Response:', errorData);
        errorDetails = `${errorDetails} - ${JSON.stringify(errorData)}`;
      } catch {
        const errorText = await response.text();
        console.error('GitHub API Error Text:', errorText);
        errorDetails = `${errorDetails} - ${errorText}`;
      }
      
      console.error('Full error details:', errorDetails);
      throw new Error(`GitHub API Error: ${errorDetails}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content?.trim() ||
      "I'm here to listen. Tell me more about what you're feeling.";
    
    console.log('Got response from GitHub API');
    return responseText;
  } catch (error: any) {
    console.error('GitHub Models API error:', error.message || error);
    
    // Check token validity
    const token = import.meta.env.VITE_GITHUB_API_TOKEN;
    if (!token || token === 'YOUR_TOKEN_HERE') {
      return "⚠️ GitHub API token is not configured properly. Please check your .env.local file and make sure VITE_GITHUB_API_TOKEN is set correctly.";
    }
    
    // Fallback response
    return "I appreciate you sharing with me. How does that make you feel? I'm here to listen.";
  }
};

// Get all conversations from localStorage
export const getAllConversations = (): Conversation[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Get single conversation
export const getConversation = (id: string): Conversation | null => {
  const conversations = getAllConversations();
  return conversations.find(c => c.id === id) || null;
};

// Save conversation to localStorage
const saveConversation = (conversation: Conversation) => {
  const conversations = getAllConversations();
  const index = conversations.findIndex(c => c.id === conversation.id);
  if (index >= 0) {
    conversations[index] = conversation;
  } else {
    conversations.push(conversation);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
};

// Create new conversation
export const createConversation = (): Conversation => {
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
  saveConversation(conversation);
  return conversation;
};

// Add message to conversation
export const addMessage = (
  conversationId: string,
  message: ChatMessage
): Conversation | null => {
  const conversation = getConversation(conversationId);
  if (!conversation) return null;

  conversation.messages.push(message);
  conversation.updatedAt = Date.now();
  saveConversation(conversation);
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
  const afterUser = addMessage(conversationId, userMsg);
  if (!afterUser) return null;

  // If crisis detected, send crisis resources immediately
  if (hasCrisisContent) {
    const crisisMsg: ChatMessage = {
      id: 'msg-' + (Date.now() + 1) + '-' + Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: getCrisisResponse(),
      timestamp: Date.now(),
    };
    return addMessage(conversationId, crisisMsg);
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
    
    return addMessage(conversationId, aiMsg);
  } catch (error) {
    console.error('Error getting AI response:', error);
    
    // Fallback error message
    const fallbackMsg: ChatMessage = {
      id: 'msg-' + (Date.now() + 1) + '-' + Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: "I'm sorry, I'm having trouble connecting right now. Please check your GitHub API token and try again.",
      timestamp: Date.now(),
    };
    
    return addMessage(conversationId, fallbackMsg);
  }
};

// Delete conversation
export const deleteConversation = (id: string): void => {
  const conversations = getAllConversations();
  const filtered = conversations.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Clear messages in conversation
export const clearConversation = (id: string): Conversation | null => {
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
  saveConversation(conversation);
  return conversation;
};

// Update conversation title
export const updateConversationTitle = (id: string, title: string): Conversation | null => {
  const conversation = getConversation(id);
  if (!conversation) return null;

  conversation.title = title;
  conversation.updatedAt = Date.now();
  saveConversation(conversation);
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
};
