// src/utils/chat.ts - Local storage based chat service
import { ChatMessage, Conversation } from '../types';
import { enhancedCheckContent, isAboutSelf } from './enhancedSuicideDetection';
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
  "Hi! 👋 I'm your AI companion. I'm here to listen and chat with you in a safe, judgment-free space. How are you feeling today, or what's been on your mind lately?";

// Critical suicide & self-harm patterns across all languages - immediate crisis response
const CRITICAL_SUICIDE_PATTERNS = [

  // ===== ENGLISH — Suicide =====
  'i want to kill myself',
  'i am going to kill myself',
  'i plan to end my life',
  'i am going to commit suicide',
  'i have decided to die',
  'i will take my own life',
  'tonight is my last night',
  'i have a plan to',
  'i already have the means',
  'i know how i will do it',
  'i want to end it all',
  'i want to disappear forever',
  'i dont want to be alive anymore',
  'i don\'t want to be alive anymore',
  'i wish i was dead',
  'i wish i were dead',
  'i want to be dead',
  'i am better off dead',
  
  'no reason to live',
  'nothing to live for',
  'i want to stop existing',
  'life is not worth living',
  
  'i have made up my mind to die',
  'i will end my suffering',
  
  'i want to overdose',
  'i have pills ready',
  
  // ===== ENGLISH — Self-Harm =====
  'i want to hurt myself',
  'i want to harm myself',
  'i want to cut myself',
  'i am cutting myself',
  'i cut myself',
  'i hurt myself',
  'i burn myself',
  'i want to burn myself',
  'i hit myself',
  'i want to hit myself',
  'i want to injure myself',
  'i am self harming',
  'i self harm',
  'i want to self harm',
  'i want to scratch myself',
  'i want to starve myself',
  'i am starving myself',
  'i want to punish myself',
  
  // ===== URDU — Suicide =====
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
  'jeena nahi chahti',
  'jeena nahi chahta',
  'jeena nahi chahti hoon',
  'jeena nahi chahta hoon',
  'zindagi se tang aa gayi hoon',
  'zindagi se tang aa gaya hoon',
  'zindagi nahi chahiye',
  'mujhe marna hai',
  'main mar jaana chahti hoon',
  'main mar jaana chahta hoon',
  'sab kuch khatam karna chahti hoon',
  'sab kuch khatam karna chahta hoon',

  // ===== URDU — Self-Harm =====
  'khud ko takleef dena chahti hoon',
  'khud ko takleef dena chahta hoon',
  'khud ko zakhmi karna chahti hoon',
  'khud ko zakhmi karna chahta hoon',
  'apne aap ko maarna chahti hoon',
  'apne aap ko maarna chahta hoon',
  'khud ko kata chahti hoon',
  'khud ko kata chahta hoon',
  'khud ko jalana chahti hoon',
  'khud ko jalana chahta hoon',
  'apne aap ko hurt karna chahti hoon',
  'apne aap ko hurt karna chahta hoon',
  'main khud ko nuksaan pohchana chahti hoon',
  'main khud ko nuksaan pohchana chahta hoon',
  

  // ===== SPANISH — Suicide =====
  'quiero matarme',
  'voy a suicidarme',
  'planeo terminar mi vida',
  'he decidido morir',
  'quiero acabar con esto',
  'no aguanto más la vida',
  'quiero dejar de existir',
  'no quiero seguir viviendo',
  'quiero desaparecer para siempre',
  'todos estarían mejor sin mí',
  'no hay razón para vivir',
  'esta es mi última noche',
  'me voy a quitar la vida',
  'ya no quiero vivir',

  // ===== SPANISH — Self-Harm =====
  'quiero hacerme daño',
  'me quiero cortar',
  'me estoy cortando',
  'me hago daño',
  'quiero lastimarme',
  'me lastimo',
  'quiero sentir dolor',
  'merezco dolor',
  'me quiero quemar',

  // ===== FRENCH — Suicide =====
  'je veux me tuer',
  'je vais me suicider',
  'je décide de mourir',
  'je veux mettre fin à ma vie',
  'j\'en ai assez de vivre',
  'je ne veux plus vivre',
  'je veux disparaître pour toujours',
  'tout le monde serait mieux sans moi',
  'je n\'ai aucune raison de vivre',
  'c\'est ma dernière nuit',
  'je vais en finir',

  // ===== FRENCH — Self-Harm =====
  'je veux me blesser',
  'je me coupe',
  'je veux me couper',
  'je me fais du mal',
  'je veux me faire du mal',
  'je mérite d\'avoir mal',
  'j\'ai besoin de souffrir',
  'je veux me brûler',

  // ===== ARABIC — Suicide =====
  'أريد أن أنهي حياتي',
  'سأنتحر',
  'لا أستطيع العيش',
  'سأضع حداً لحياتي',
  'أريد أن أموت',
  'لا أريد أن أكمل حياتي',
  'الجميع أفضل بدوني',
  'لا سبب للعيش',
  'أريد الاختفاء إلى الأبد',
  'هذه آخر ليلة لي',

  // ===== ARABIC — Self-Harm =====
  'أريد إيذاء نفسي',
  'أريد جرح نفسي',
  'أجرح نفسي',
  'أريد أن أتألم',
  'أستحق الألم',
  'أريد أن أحرق نفسي',
  'أعاقب نفسي',

  // ===== PORTUGUESE — Suicide =====
  'quero me matar',
  'vou me suicidar',
  'quero acabar com minha vida',
  'não aguento mais viver',
  'não quero mais viver',
  'quero desaparecer para sempre',
  'todos ficariam melhor sem mim',
  'não tenho razão para viver',
  'esta é minha última noite',

  // ===== PORTUGUESE — Self-Harm =====
  'quero me machucar',
  'me machucar',
  'quero me cortar',
  'me corto',
  'mereço dor',
  'preciso sentir dor',
  'quero me queimar',

  // ===== GERMAN — Suicide =====
  'ich will mich töten',
  'ich werde mich umbringen',
  'ich will mein Leben beenden',
  'ich kann nicht mehr leben',
  'ich will nicht mehr leben',
  'ich will für immer verschwinden',
  'alle wären besser ohne mich',
  'es gibt keinen grund mehr zu leben',
  'das ist meine letzte nacht',

  // ===== GERMAN — Self-Harm =====
  'ich will mir wehtun',
  'ich verletze mich selbst',
  'ich will mich schneiden',
  'ich schneide mich',
  'ich verdiene schmerzen',
  'ich brauche schmerzen',
  'ich will mich verbrennen',
  'ich bestrafe mich',

  // ===== ITALIAN — Suicide =====
  'voglio suicidarmi',
  'vado a togliermi la vita',
  'non posso più vivere',
  'voglio morire',
  'non voglio più vivere',
  'voglio sparire per sempre',
  'tutti starebbero meglio senza di me',
  'non ho motivo di vivere',
  'questa è la mia ultima notte',

  // ===== ITALIAN — Self-Harm =====
  'voglio farmi del male',
  'mi faccio del male',
  'voglio tagliarmi',
  'mi taglio',
  'merito di soffrire',
  'ho bisogno di sentire dolore',
  'voglio bruciarmi',

  // ===== HINDI — Suicide =====
  'main apne aap ko maarna chahta hoon',
  'main aatmahatya karna chahta hoon',
  'mujhe jeena nahi hai',
  'zindagi se thak gaya hoon',
  'main mar jaana chahta hoon',
  'mujhe marna hai',
  'sab mere bina behtar rahenge',
  'jeene ki koi wajah nahi',
  'aaj meri aakhri raat hai',
  'main apni jaan lena chahta hoon',
  'zindagi khatam kar loon',

  // ===== HINDI — Self-Harm =====
  'main apne aap ko takleef dena chahta hoon',
  'main khud ko zakhmi karna chahta hoon',
  'main khud ko kaatna chahta hoon',
 
 
  'main khud ko jalana chahta hoon',
  'main apne aap ko nuksaan pohchana chahta hoon',

  // ===== BENGALI — Suicide =====
  'ami nij-deh poriksha korte chai',
  'ami jeeban sesh korte chai',
  'jeeban aro chalte parchhi na',
  'ami morte chai',
  'ami amar jibon sesh korte chai',
  'ami hariye jete chai chirokaaler jonno',
  'shobar jonno valo hobe amar bina',
  'bacher kono karon nei',

  // ===== BENGALI — Self-Harm =====
  'ami nijer khoti korte chai',
  'ami nijeke kaatle chai',
  'ami kosto pete chai',
  'ami shasti paowar joggo',
  'ami nijeke pora chai',

  // ===== TURKISH — Suicide =====
  'kendimi öldürmek istiyorum',
  'intihar edeceğim',
  'hayatımı bitirmek istiyorum',
  'artık dayanamıyorum',
  'yaşamak istemiyorum',
  'sonsuza kadar kaybolmak istiyorum',
  'bensiz herkes daha iyi olur',
  'yaşamaya devam etmek istemiyorum',
  'bu benim son gecem',
  'kendime kıymak istiyorum',

  // ===== TURKISH — Self-Harm =====
  'kendime zarar vermek istiyorum',
  'kendimi kesmek istiyorum',
  'kendimi kesiyorum',
  'acı hissetmek istiyorum',
  'acıyı hak ediyorum',
  'kendimi yakmak istiyorum',
  'kendimi cezalandırmak istiyorum',

  // ===== RUSSIAN — Suicide =====
  'я хочу убить себя',
  'я собираюсь покончить с собой',
  'я хочу умереть',
  'я не хочу больше жить',
  'я хочу исчезнуть навсегда',
  'всем будет лучше без меня',
  'нет смысла жить',
  'это моя последняя ночь',

  // ===== RUSSIAN — Self-Harm =====
  'я хочу причинить себе вред',
  'я режу себя',
  'я хочу порезать себя',
  'я заслуживаю боли',
  'мне нужно чувствовать боль',
  'я хочу сжечь себя',
  'я наказываю себя',

  // ===== JAPANESE — Suicide =====
  '死にたい',
  '自殺したい',
  '消えてしまいたい',
  '生きていたくない',
  'もう生きていられない',
  '死ぬつもり',
  '命を絶ちたい',
  'みんな私がいなければよかった',

  // ===== JAPANESE — Self-Harm =====
  '自分を傷つけたい',
  '自分を切りたい',
  '自傷している',
  '痛みを感じたい',
  '自分を罰したい',
  '自分を燃やしたい',

  // ===== CHINESE (Simplified) — Suicide =====
  '我想死',
  '我要自杀',
  '我想结束生命',
  '我不想活了',
  '我想消失',
  '没有我大家会更好',
  '活着没有意义',
  '今晚是我最后一夜',

  // ===== CHINESE (Simplified) — Self-Harm =====
  '我想伤害自己',
  '我想割自己',
  '我在割自己',
  '我想感受痛苦',
  '我应该受苦',
  '我想惩罚自己',

  // ===== KOREAN — Suicide =====
  '죽고 싶다',
  '자살하고 싶다',
  '사라지고 싶다',
  '더 이상 살고 싶지 않다',
  '내가 없으면 다들 더 나을 거야',
  '살 이유가 없다',
  '오늘이 내 마지막 밤이야',

  // ===== KOREAN — Self-Harm =====
  '나 자신을 다치게 하고 싶다',
  '나를 자르고 싶다',
  '나 자신을 해치고 있어',
  '고통을 느끼고 싶다',
  '나는 벌을 받아야 해',
  '나 자신을 태우고 싶다',

  // ===== INDONESIAN/MALAY — Suicide =====
  'saya ingin mati',
  'saya ingin bunuh diri',
  'saya ingin mengakhiri hidup saya',
  'saya tidak ingin hidup lagi',
  'semua orang lebih baik tanpa saya',
  'tidak ada alasan untuk hidup',
  'ini malam terakhir saya',

  // ===== INDONESIAN/MALAY — Self-Harm =====
  'saya ingin menyakiti diri sendiri',
  'saya ingin memotong diri sendiri',
  'saya menyakiti diri sendiri',
  'saya ingin merasakan sakit',
  'saya layak mendapat rasa sakit',
  'saya ingin membakar diri sendiri',

  // ===== SWAHILI — Suicide =====
  'nataka kujiua',
  'nitatoa uhai wangu',
  'sitaki kuishi tena',
  'kila mtu atakuwa bora bila mimi',
  'hakuna sababu ya kuishi',

  // ===== SWAHILI — Self-Harm =====
  'nataka kujidhuru',
  'ninajikata',
  'nataka kuhisi maumivu',
  'nastahili maumivu',

  // ===== PUNJABI — Suicide =====
  'main apne aap nu maarna chahunda haan',
  'main khatam ho jaana chahunda haan',
  'mujhe jeona nahi',
  'main mar jaana chahunda haan',
  'sab mere bina changey rahange',

  // ===== PUNJABI — Self-Harm =====
  'main apne aap nu takleef dena chahunda haan',
  'main khud nu zakhmi karna chahunda haan',
 
  'main saza chahunda haan apne aap nu',
];

// Check if message contains critical suicide/self-harm keywords - immediate crisis response
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
      const error = response.body.error;
      if (error?.code === 'content_filter' || error?.innererror?.code === 'ResponsibleAIPolicyViolation') {
        const contentFilter = error?.innererror?.content_filter_result;
        console.warn('🚨 Content filter triggered:', contentFilter);
        
        // For self-harm content, provide supportive redirection
        if (contentFilter?.self_harm?.filtered) {
          return getCrisisResourcesResponse();
        }
        
        return "I appreciate you sharing, but I'm having trouble with this topic. " +
               "If you're struggling, please reach out to someone who can help. " +
               "Would you like to talk about something else, or would crisis resources be helpful?";
      }
      console.error('GitHub Models API error:', error);
      throw new Error(`GitHub Models API error: ${error?.message || 'Unknown error'}`);
    }

    const responseText = response.body.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response.";
    
    return responseText;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('GitHub Models API error:', errorMsg);
    console.error('GitHub endpoint used:', GITHUB_ENDPOINT);

    // Provide helpful error messages
    if (errorMsg.includes('Invalid or expired token')) {
      return "I'm having trouble connecting to the AI service. Please refresh the page and try again.";
    }

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

  // ✅ SELF-REFERENTIAL CHECK — Only trigger crisis if user is talking about THEMSELVES
  // e.g. "mera dost marna chahta hai" or "my friend wants to die" → skip crisis, respond normally
  const aboutSelf = isAboutSelf(content);

  // ✅ CRITICAL MESSAGE CHECK - Immediate crisis response for all languages
  if (aboutSelf && isCriticalMessage(content)) {
    // Create admin alert immediately
    await adminDashboard.createAlert(
      'current-user',
      conversationId,
      content,
      {
        riskLevel: 'critical', riskFactors: ['Direct suicide/self-harm threat detected'], recommendedAction: 'IMMEDIATE INTERVENTION REQUIRED',
        confidence: 0,
        contextualCues: [],
        flagged: false
      }
    );

    // Send crisis alert to backend
    try {
      await sendCrisisAlertToBackend(
        'current-user',
        content,
        { riskLevel: 'critical', riskFactors: ['Direct suicide/self-harm threat detected'], recommendedAction: 'IMMEDIATE INTERVENTION REQUIRED' },
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
      reason: 'Critical suicide/self-harm threat detected - immediate crisis response',
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
      reason: riskAnalysis.recommendedAction || 'High suicide/self-harm risk detected',
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