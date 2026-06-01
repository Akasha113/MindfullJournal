// src/utils/chat.ts
import { ChatMessage, Conversation } from '../types';
import { enhancedCheckContent, isAboutSelf, isInformationalQuery } from './enhancedSuicideDetection';
import { storage } from './storage';
import { adminDashboard } from './adminDashboard';
import { ModelClient } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { isUnexpected } from '@azure-rest/ai-inference';

const GITHUB_ENDPOINT =
  import.meta.env.VITE_GITHUB_API_ENDPOINT ||
  import.meta.env.VITE_AZURE_INFERENCE_ENDPOINT ||
  'https://models.inference.ai.azure.com';

const GITHUB_MODEL = import.meta.env.VITE_GITHUB_MODEL || 'gpt-4o-mini';

console.log('🔣 AI endpoint:', GITHUB_ENDPOINT, 'model:', GITHUB_MODEL);

const THERAPIST_PERSONALITY = `You are a friendly and supportive mental-health companion. Your role is to:
- Listen to what people tell you and show you care
- Ask thoughtful follow-up questions and validate emotions
- Give helpful, kind suggestions (2-3 sentences typically)
- Be respectful and non-judgmental
- If someone asks about suicide or self-harm in an educational way, respond with empathetic factual information — but NEVER provide specific methods.
- If someone asks HOW to perform self-harm or suicide, gently redirect to professional help without any method details.
- Only trigger crisis resources when the person clearly describes their OWN immediate intent with explicit first-person statements.
- If someone is talking about another person, help them support that person — do not treat it as the user's own crisis.`;

const INITIAL_GREETING =
  "Hi! 👋 I'm your AI companion. I'm here to listen and chat with you in a safe, judgment-free space. How are you feeling today, or what's been on your mind lately?";

// ---------------------------------------------------------------------------
// CRITICAL PATTERNS — full explicit sentences only (never single words)
// ---------------------------------------------------------------------------
const CRITICAL_SUICIDE_PATTERNS = [
  // English — Suicide
  'i want to kill myself', 'i am going to kill myself', 'i plan to end my life',
  'i am going to commit suicide', 'i have decided to die', 'i will take my own life',
  'tonight is my last night', 'i already have the means to end',
  'i know how i will do it', 'i want to end it all', 'i want to disappear forever',
  'i dont want to be alive anymore', "i don't want to be alive anymore",
  'i wish i was dead', 'i wish i were dead', 'i want to be dead', 'i am better off dead',
  'everyone would be better without me', 'no reason to live', 'nothing to live for',
  'i want to stop existing', 'life is not worth living',
  "i cant take it anymore", "i can't take it anymore",
  'this is my last message', 'goodbye forever', 'i have made up my mind to die',
  'i will end my suffering', 'i want to jump off a bridge', 'i want to overdose',
  'i have pills ready to take', 'i have a gun ready', 'i have a knife ready to use on myself',
  // English — Self-Harm
  'i want to hurt myself', 'i want to harm myself', 'i want to cut myself',
  'i am cutting myself', 'i cut myself', 'i hurt myself', 'i burn myself',
  'i want to burn myself', 'i want to injure myself', 'i am self harming',
  'i self harm', 'i want to self harm', 'i want to starve myself',
  'i am starving myself', 'i want to punish myself', 'i deserve pain',
  'i deserve to be hurt', 'i want to feel pain', 'i need to feel pain',
  // Urdu — Suicide
  'khudkushi karna chahti hoon', 'khudkushi karna chahta hoon',
  'jaan lena chahti hoon', 'jaan lena chahta hoon',
  'marna chahti hoon', 'marna chahta hoon', 'mn marna chahti hon', 'mn marna chahta hon',
  'khudkushi karne wali hoon', 'khudkushi karne wala hoon',
  'zindagi khatam karna chahti hoon', 'zindagi khatam karna chahta hoon',
  'khud ko maarna chahti hoon', 'khud ko maarna chahta hoon',
  'khud ko marna chahti hoon', 'khud ko marna chahta hoon',
  'aaj raat meri aakhri raat hai', 'kal mera aakhri din hai',
  'main marne ka faisla kar chuki hoon', 'main marne ka faisla kar chuka hoon',
  'mn marne ka faisla kar chuki hoon', 'mn marne ka faisla kar chuka hoon',
  'main khudkushi karne wali hoon', 'main khudkushi karne wala hoon',
  'mn khudkushi karne wali hoon', 'mn khudkushi karne wala hoon',
  'jeena nahi chahti', 'jeena nahi chahta',
  'mujhe marna hai', 'main mar jaana chahti hoon', 'main mar jaana chahta hoon',
  'zindagi se tang aa gayi hoon', 'zindagi se tang aa gaya hoon',
  'zindagi nahi chahiye mujhe',
  // Urdu — Self-Harm
  'khud ko takleef dena chahti hoon', 'khud ko takleef dena chahta hoon',
  'khud ko zakhmi karna chahti hoon', 'khud ko zakhmi karna chahta hoon',
  'khud ko jalana chahti hoon', 'khud ko jalana chahta hoon',
  'dard chahiye mujhe', 'mujhe saza milni chahiye',
  // Spanish
  'quiero matarme', 'voy a suicidarme', 'planeo terminar mi vida',
  'he decidido morir', 'quiero acabar con mi vida', 'no aguanto más la vida',
  'quiero dejar de existir', 'no quiero seguir viviendo', 'ya no quiero vivir',
  'quiero hacerme daño', 'me estoy cortando', 'merezco dolor',
  // French
  'je veux me tuer', 'je vais me suicider', "j'ai décidé de mourir",
  'je veux mettre fin à ma vie', "j'en ai assez de vivre", 'je ne veux plus vivre',
  'je veux me blesser', 'je me fais du mal',
  // Arabic
  'أريد أن أنهي حياتي', 'سأنتحر', 'أريد أن أموت',
  'أريد إيذاء نفسي', 'أجرح نفسي',
  // Portuguese
  'quero me matar', 'vou me suicidar', 'quero acabar com minha vida',
  'não aguanto mais viver', 'não quero mais viver', 'quero me machucar',
  // German
  'ich will mich töten', 'ich werde mich umbringen', 'ich will mein leben beenden',
  'ich kann nicht mehr leben', 'ich will nicht mehr leben', 'ich will mir wehtun',
  // Italian
  'voglio suicidarmi', 'non posso più vivere', 'voglio morire',
  'voglio farmi del male',
  // Hindi
  'main apne aap ko maarna chahta hoon', 'main aatmahatya karna chahta hoon',
  'mujhe jeena nahi hai', 'main mar jaana chahta hoon',
  // Bengali
  'ami jeeban sesh korte chai', 'ami morte chai',
  // Turkish
  'kendimi öldürmek istiyorum', 'intihar edeceğim', 'hayatımı bitirmek istiyorum',
  'yaşamak istemiyorum', 'kendime zarar vermek istiyorum',
  // Russian
  'я хочу убить себя', 'я хочу умереть', 'я не хочу больше жить',
  // Japanese
  '死にたい', '自殺したい', '生きていたくない',
  // Chinese
  '我想死', '我要自杀', '我不想活了',
  // Korean
  '죽고 싶다', '자살하고 싶다',
  // Indonesian / Malay
  'saya ingin mati', 'saya ingin bunuh diri',
  // Punjabi
  'main apne aap nu maarna chahunda haan', 'main mar jaana chahunda haan',
];

// Phrases indicating someone is asking HOW to perform self-harm
const METHOD_REQUEST_PATTERNS = [
  'how to kill myself', 'how to commit suicide', 'ways to kill myself',
  'ways to commit suicide', 'best way to die', 'easiest way to die',
  'painless way to die', 'how to end my life', 'methods of suicide',
  'suicide methods', 'how to overdose', 'how to hang myself',
  'how to cut myself', 'how to harm myself', 'how do i kill myself',
  'how do people kill themselves', 'what pills to take to die',
  'what is the best method to die',
  'khudkushi kaise karte hain', 'khudkushi ka tarika', 'marne ka tarika',
  'cómo suicidarme', 'maneras de suicidarse',
  'comment se suicider', 'méthodes de suicide',
  'wie töte ich mich', 'wie bringe ich mich um',
  'كيف أنتحر', 'طرق الانتحار',
];

// ---------------------------------------------------------------------------
// DETECTION HELPERS
// ---------------------------------------------------------------------------
const isMethodRequest = (message: string): boolean => {
  const lower = message.toLowerCase();
  return METHOD_REQUEST_PATTERNS.some(p => lower.includes(p));
};

const isCriticalMessage = (message: string): boolean => {
  if (isInformationalQuery(message)) return false;
  if (!isAboutSelf(message)) return false;
  const lower = message.toLowerCase();
  return CRITICAL_SUICIDE_PATTERNS.some(p => lower.includes(p.toLowerCase()));
};

const isThirdPartyCrisisMention = (message: string): boolean => {
  if (isInformationalQuery(message)) return false;
  if (isAboutSelf(message)) return false;
  const lower = message.toLowerCase();
  return CRITICAL_SUICIDE_PATTERNS.some(p => lower.includes(p.toLowerCase()));
};

// ---------------------------------------------------------------------------
// RESPONSE BUILDERS
// ---------------------------------------------------------------------------
const getThirdPartySupportResponse = (): string =>
  `I'm sorry to hear that someone you know is struggling. It can feel overwhelming when someone close to you is in pain.

If you're worried about them, the most important thing is to encourage them to reach out to a trusted friend, family member, or mental health professional. Staying connected and listening without judgment can make a real difference.

I'm here to listen to how *you're* feeling about this situation. How are you coping with what you're seeing?`;

const getMethodRedirectResponse = (): string =>
  `I can hear that you're in a lot of pain right now, and I'm really concerned about you. I'm not able to share information on ways to hurt yourself — but I genuinely want to help you through what you're feeling.

**Please reach out to someone who can support you right now:**
• **Call or text 988** — Suicide & Crisis Lifeline (US, 24/7, free)
• **Text "HELLO" to 741741** — Crisis Text Line (24/7)
• **International:** https://www.iasp.info/resources/Crisis_Centres/

You don't have to carry this alone. Can you tell me more about what's brought you to this point? I'm here to listen. ❤️`;

const getCrisisResourcesResponse = (): string =>
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
// AI MODEL CALL
// ---------------------------------------------------------------------------
export const initializeConversation = (conversationId: string): Conversation | null => {
  let updatedConvo = storage.addMessageToConversation(conversationId, {
    role: 'system',
    content: THERAPIST_PERSONALITY,
  });
  if (!updatedConvo) return null;
  return storage.addMessageToConversation(conversationId, {
    role: 'assistant',
    content: INITIAL_GREETING,
  });
};

export const fetchGitHubModelResponse = async (messages: ChatMessage[]): Promise<string> => {
  try {
    const token = import.meta.env.VITE_GITHUB_API_TOKEN;
    if (!token) throw new Error('GitHub API token missing.');

    const client = ModelClient(GITHUB_ENDPOINT, new AzureKeyCredential(token));
    const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));

    const response = await client.path('/chat/completions').post({
      body: { messages: apiMessages, temperature: 0.7, top_p: 1.0, max_tokens: 512, model: GITHUB_MODEL },
    });

    if (isUnexpected(response)) throw new Error(response.body.error?.message || 'Unknown error');
    return response.body.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('GitHub Models API error:', error);
    return "I'm sorry, I couldn't connect to the AI service right now. Please try again later.";
  }
};

// ---------------------------------------------------------------------------
// MAIN sendMessage
// ---------------------------------------------------------------------------
export const sendMessage = async (
  conversationId: string,
  content: string,
  contentType: 'chat' | 'journal' = 'chat'
): Promise<Conversation | null> => {
  const convo = storage.getConversation(conversationId);
  if (!convo) return null;

  // ── BRANCH 1: Informational / educational query → normal AI response ──────
  if (isInformationalQuery(content)) {
    const updatedConvo = storage.addMessageToConversation(conversationId, { role: 'user', content });
    if (!updatedConvo) return null;
    try {
      const aiResponse = await fetchGitHubModelResponse(updatedConvo.messages);
      return storage.addMessageToConversation(conversationId, { role: 'assistant', content: aiResponse });
    } catch {
      return storage.addMessageToConversation(conversationId, {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
      });
    }
  }

  // ── BRANCH 2: Method request → redirect without providing methods ──────────
  if (isMethodRequest(content)) {
    if (isAboutSelf(content)) {
      await sendCrisisAlertToBackend('current-user', content,
        { riskLevel: 'critical', riskFactors: ['method_seeking'], recommendedAction: 'URGENT: Method request detected' },
        conversationId, contentType);
    }
    const updatedConvo = storage.addMessageToConversation(conversationId, { role: 'user', content });
    if (!updatedConvo) return null;
    return storage.addMessageToConversation(conversationId, {
      role: 'assistant',
      content: getMethodRedirectResponse(),
    });
  }

  // ── BRANCH 3: Third-party crisis mention → empathy only, no hotlines ──────
  if (isThirdPartyCrisisMention(content)) {
    const updatedConvo = storage.addMessageToConversation(conversationId, { role: 'user', content });
    if (!updatedConvo) return null;
    return storage.addMessageToConversation(conversationId, {
      role: 'assistant',
      content: getThirdPartySupportResponse(),
    });
  }

  // ── BRANCH 4: First-person explicit crisis → crisis resources + admin alert ─
  if (isCriticalMessage(content)) {
    await adminDashboard.createAlert('current-user', conversationId, content, {
      riskLevel: 'critical', riskFactors: ['Direct suicide/self-harm threat'],
      recommendedAction: 'IMMEDIATE INTERVENTION REQUIRED',
      confidence: 0, contextualCues: [], flagged: false,
    });
    try {
      await sendCrisisAlertToBackend('current-user', content,
        { riskLevel: 'critical', riskFactors: ['Direct suicide/self-harm threat'], recommendedAction: 'IMMEDIATE INTERVENTION REQUIRED' },
        conversationId, contentType);
    } catch (err) { console.error('Failed to send critical alert:', err); }

    const updatedConvo = storage.addMessageToConversation(conversationId, { role: 'user', content });
    if (!updatedConvo) return null;
    storage.addFlaggedContent({ type: contentType, content, reason: 'Critical threat', riskLevel: 'critical' });
    return storage.addMessageToConversation(conversationId, {
      role: 'assistant',
      content: getCrisisResourcesResponse(),
    });
  }

  // ── BRANCH 5: Enhanced risk analysis for borderline messages ──────────────
  let riskAnalysis;
  try {
    const ctx = {
      messages: convo.messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content, timestamp: m.timestamp })),
      userId: 'current-user', conversationId,
    };
    riskAnalysis = await enhancedCheckContent(content, ctx);
    if (riskAnalysis.riskLevel === 'high') {
      await adminDashboard.createAlert('current-user', conversationId, content, riskAnalysis);
      try {
        await sendCrisisAlertToBackend('current-user', content, riskAnalysis, conversationId, contentType);
      } catch (err) { console.error('Failed to send high-risk alert:', err); }
    }
  } catch (err) { console.error('Error in risk analysis:', err); }

  // ── BRANCH 6: Normal conversation ─────────────────────────────────────────
  const updatedConvo = storage.addMessageToConversation(conversationId, { role: 'user', content });
  if (!updatedConvo) return null;

  if (riskAnalysis?.riskLevel === 'high') {
    storage.addFlaggedContent({ type: contentType, content, reason: riskAnalysis.recommendedAction, riskLevel: 'high' });
  }

  try {
    const aiResponse = await fetchGitHubModelResponse(updatedConvo.messages);
    return storage.addMessageToConversation(conversationId, { role: 'assistant', content: aiResponse });
  } catch {
    return storage.addMessageToConversation(conversationId, {
      role: 'assistant',
      content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
    });
  }
};

// ---------------------------------------------------------------------------
// BACKEND ALERT
// ---------------------------------------------------------------------------
const sendCrisisAlertToBackend = async (
  userId: string, content: string, riskAnalysis: any,
  conversationId: string, contentType: 'chat' | 'journal'
): Promise<void> => {
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  const response = await fetch(`${backendUrl}/api/admin/crisis-alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId, content, contentType,
      riskLevel: riskAnalysis.riskLevel,
      riskScore: riskAnalysis.confidence || 0,
      detectedKeywords: riskAnalysis.riskFactors || [],
      riskFactors: riskAnalysis.riskFactors || [],
      conversationId,
      userName: 'Current User', userEmail: '',
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Backend ${response.status}: ${err.error || 'Unknown error'}`);
  }
  const result = await response.json();
  console.log('✅ Crisis alert sent:', result.alert?._id);
};

export default { fetchGitHubModelResponse, sendMessage, initializeConversation };