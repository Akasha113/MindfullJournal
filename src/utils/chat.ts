// src/utils/chat.ts - Local storage based chat service
import { ChatMessage, Conversation } from '../types';
import { enhancedCheckContent } from './enhancedSuicideDetection';
import { storage } from './storage';
import { adminDashboard } from './adminDashboard';
import { ModelClient } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { isUnexpected } from '@azure-rest/ai-inference';

// GitHub/Azure Models configuration
const GITHUB_ENDPOINT =
  import.meta.env.VITE_GITHUB_API_ENDPOINT ||
  import.meta.env.VITE_AZURE_INFERENCE_ENDPOINT ||
  'https://models.inference.ai.azure.com';

const GITHUB_MODEL = import.meta.env.VITE_GITHUB_MODEL || 'gpt-4o-mini';

console.log('🔣 AI endpoint:', GITHUB_ENDPOINT, 'model:', GITHUB_MODEL);

const THERAPIST_PERSONALITY =
  "You are Dr. Sarah, a compassionate and experienced therapist. Respond warmly and empathetically to the user's messages. Give supportive advice, ask thoughtful follow-up questions, and validate their emotions. Keep responses concise but meaningful (2-3 sentences typically).";

const INITIAL_GREETING =
  "Hi! 👋 I'm your AI companion. I'm here to listen and chat with you in a safe, judgment-free space. How are you feeling today, or what’s been on your mind lately?";

// Critical suicide patterns across all languages - immediate crisis response
const CRITICAL_SUICIDE_PATTERNS = [
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
  'mn khudkushi krna chahti hon',
  'mn khudkushi krna chahta hon',

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

// Check if message contains critical suicide keywords - immediate crisis response
const isCriticalMessage = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return CRITICAL_SUICIDE_PATTERNS.some(pattern =>
    lowerMessage.includes(pattern.toLowerCase())
  );
};


// Crisis resources response for high-risk messages
const getCrisisResourcesResponse = (riskLevel: string): string => {
  if (riskLevel === 'critical') {
    return `🚨 **IMMEDIATE HELP AVAILABLE** 🚨

I'm very concerned about what you've shared. Your safety is the most important thing right now.

**IMMEDIATE CRISIS SUPPORT:**
• **Call 988** - National Suicide Prevention Lifeline (24/7)
• **Text HOME to 741741** - Crisis Text Line (24/7)
• **Call 911** - For immediate emergency assistance

**International Crisis Lines:**
• UK: 116 123 (Samaritans)
• Canada: 1-833-456-4566
• Australia: 13 11 14 (Lifeline)

**You are not alone.** These trained counselors are available right now to talk with you and help you through this difficult time.

If you're in immediate danger, please reach out to emergency services or go to your nearest hospital emergency room.

Would you like me to help you find local mental health resources or talk about what's making you feel this way?`;
  } else if (riskLevel === 'high') {
    return `💙 **I'm Here to Listen** 💙

I hear that you're going through a really tough time right now. It takes courage to share what you're feeling.

**Support Resources Available:**
• **Call 988** - National Suicide Prevention Lifeline
• **Text HOME to 741741** - Crisis Text Line
• **Call 211** - Find local mental health resources

**Remember:**
• These feelings are temporary, even when they feel overwhelming
• Professional counselors are trained to help with exactly what you're experiencing
• Reaching out for help is a sign of strength, not weakness

**Immediate Coping Strategies:**
• Take slow, deep breaths
• Reach out to a trusted friend or family member
• Stay in a safe environment

I'm here to listen and support you. Would you like to talk about what's happening, or would you prefer information about local mental health services?`;
  }
  
  return "I'm here to support you. If you're having thoughts of self-harm, please reach out to the National Suicide Prevention Lifeline at 988.";
};

// Initialize a new conversation with the therapist's greeting
export const initializeConversation = (conversationId: string): Conversation | null => {
  // Add the system prompt (hidden from user)
  let updatedConvo = storage.addMessageToConversation(conversationId, {
    role: 'system',
    content: THERAPIST_SYSTEM_PROMPT,
  });

  if (!updatedConvo) return null;

  // Add the initial greeting from the therapist (visible to user)
  updatedConvo = storage.addMessageToConversation(conversationId, {
    role: 'assistant',
    content: INITIAL_GREETING,
  });

  return updatedConvo;
};

// Fetches a response from GitHub Models API using Azure REST client
export const fetchGitHubModelResponse = async (messages: ChatMessage[]): Promise<string> => {
  try {
    const token = import.meta.env.VITE_GITHUB_API_TOKEN; // GitHub Personal Access Token

    if (!token) {
      throw new Error('GitHub API token is missing. Please set VITE_GITHUB_API_TOKEN in your environment variables.');
    }

    // Create the Azure REST client
    const client = ModelClient(
      GITHUB_ENDPOINT,
      new AzureKeyCredential(token)
    );

    // Convert messages to the required format
    const apiMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const response = await client.path("/chat/completions").post({
      body: {
        messages: apiMessages,
        temperature: 0.7,
        top_p: 1.0,
        max_tokens: 512,
        model: GITHUB_MODEL
      }
    });

    if (isUnexpected(response)) {
      console.error('GitHub Models API error:', response.body.error);
      throw new Error(`GitHub Models API error: ${response.body.error?.message || 'Unknown error'}`);
    }

    const responseText = response.body.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response.";
    
    return responseText;
  } catch (error) {
    console.error('GitHub Models API error:', error);
    console.error('GitHub endpoint used:', GITHUB_ENDPOINT);

    // Fallback message to avoid complete failed UX
    return "I'm sorry, I couldn't connect to the AI service right now. Please try again later; meanwhile I'm still here to listen.";
  }
};


// Add an optional contentType parameter to support both 'chat' and 'journal'
export const sendMessage = async (
  conversationId: string,
  content: string,
  contentType: 'chat' | 'journal' = 'chat'
): Promise<Conversation | null> => {
  // Fetch current conversation
  const convo = storage.getConversation(conversationId);

  if (!convo) return null;

  // ✅ CRITICAL MESSAGE CHECK - Immediate crisis response for all languages
  if (isCriticalMessage(content)) {
    // Create admin alert immediately
    await adminDashboard.createAlert(
      'current-user',
      conversationId,
      content,
      { riskLevel: 'critical', riskFactors: ['Direct suicide threat detected'], recommendedAction: 'IMMEDIATE INTERVENTION REQUIRED' }
    );

    // Send crisis alert to backend
    try {
      await sendCrisisAlertToBackend(
        'current-user',
        content,
        { riskLevel: 'critical', riskFactors: ['Direct suicide threat detected'], recommendedAction: 'IMMEDIATE INTERVENTION REQUIRED' },
        conversationId,
        contentType
      );
    } catch (backendError) {
      console.error('Failed to send critical alert to backend:', backendError);
    }

    // Add the user's message
    const updatedConvo = storage.addMessageToConversation(conversationId, {
      role: 'user',
      content,
    });

    if (!updatedConvo) return null;

    // Flag the content as critical
    storage.addFlaggedContent({
      type: contentType,
      content,
      reason: 'Critical suicide threat detected - immediate crisis response',
      riskLevel: 'critical',
    });

    // 🚨 IMMEDIATE CRISIS RESPONSE - No AI call
    const crisisResponse = getCrisisResourcesResponse('critical');
    return storage.addMessageToConversation(conversationId, {
      role: 'assistant',
      content: crisisResponse,
    });
  }

  // Enhanced suicide risk analysis for non-critical messages
  let riskAnalysis;
  try {
    const conversationContext = {
      messages: convo.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: msg.timestamp
      })),
      userId: 'current-user', // You may want to get this from context
      conversationId: conversationId
    };

    riskAnalysis = await enhancedCheckContent(content, conversationContext);
    
    // Handle high-risk cases (non-critical direct threats)
    if (riskAnalysis.riskLevel === 'high') {
      // Create admin alert for high-risk cases
      await adminDashboard.createAlert(
        'current-user',
        conversationId,
        content,
        riskAnalysis
      );
      
      // Send high-risk alert to backend
      try {
        await sendCrisisAlertToBackend(
          'current-user',
          content,
          riskAnalysis,
          conversationId,
          contentType
        );
      } catch (backendError) {
        console.error('Failed to send high-risk alert to backend:', backendError);
        // Continue - alert was created locally
      }
    }

  } catch (error) {
    console.error('Error in suicide risk analysis:', error);
  }

  // Add the user's message
  const updatedConvo = storage.addMessageToConversation(conversationId, {
    role: 'user',
    content,
  });

  if (!updatedConvo) return null;

  // For high risk (non-direct threats): flag but allow chat to continue
  if (riskAnalysis && riskAnalysis.riskLevel === 'high') {
    storage.addFlaggedContent({
      type: contentType,
      content,
      reason: riskAnalysis.recommendedAction || 'High suicide risk detected',
      riskLevel: 'high',
    });
    // No warning message is shown to the user for high risk
    // Continue with AI response or journal flow
  }

  try {
    // Get real AI response from GitHub Models for non-crisis messages
    const aiResponse = await fetchGitHubModelResponse(updatedConvo.messages);

    // Add AI response to conversation history
    return storage.addMessageToConversation(conversationId, {
      role: 'assistant',
      content: aiResponse,
    });
  } catch (error) {
    console.error('Error getting GitHub Models response:', error);
    // Fallback error message
    return storage.addMessageToConversation(conversationId, {
      role: 'assistant',
      content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
    });
  }
};

/**
 * Send crisis alert to backend to trigger email notification to admin
 * This function creates a database record and sends an email alert to the admin
 */
const sendCrisisAlertToBackend = async (
  userId: string,
  content: string,
  riskAnalysis: any,
  conversationId: string,
  contentType: 'chat' | 'journal'
): Promise<void> => {
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
    
    const alertPayload = {
      userId,
      content,
      contentType,
      riskLevel: riskAnalysis.riskLevel,
      riskScore: riskAnalysis.confidence || 0,
      detectedKeywords: riskAnalysis.riskFactors || [],
      riskFactors: riskAnalysis.riskFactors || [],
      conversationId,
      userName: 'Current User', // You can get actual name from auth context
      userEmail: '', // Will be retrieved from userId on backend
    };

    console.log('📧 Sending crisis alert to backend:', {
      riskLevel: riskAnalysis.riskLevel,
      conversationId,
      contentLength: content.length
    });

    const response = await fetch(`${backendUrl}/api/admin/crisis-alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend responded with ${response.status}: ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('✅ Crisis alert sent to backend successfully:', result.alert?._id);
    
  } catch (error) {
    console.error('❌ Failed to send crisis alert to backend:', error);
    throw error; // Re-throw so caller knows it failed
  }
};

export default {
  fetchGitHubModelResponse,
  sendMessage,
  initializeConversation,
};