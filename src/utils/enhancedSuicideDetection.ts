import { checkContent } from './contentMonitor';

export interface SuicideRiskAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  riskFactors: string[];
  contextualCues: string[];
  mcpClassification?: boolean;
  recommendedAction: string;
  flagged: boolean;
  reason?: string;
}

interface ConversationContext {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  }>;
  userId: string;
  conversationId: string;
}

// ============================================================
// INFORMATIONAL QUERY DETECTION
//
// Returns true for educational / research / general questions
// about suicide so they NEVER trigger a crisis response.
//
// Examples that return true (informational — no crisis):
//   "what is suicide?"
//   "why do people commit suicide?"
//   "is suicide a sin?"
//   "kya khudkushi gunah hai?"
//   "what are warning signs of suicide?"
//   "how common is suicide?"
//   "is suicide good or bad?"
// ============================================================
const INFORMATIONAL_INDICATORS = [
  // ===== ENGLISH =====
  'is suicide', 'are suicides', 'was suicide',
  'why do people', 'why does someone', 'why would someone',
  'what is suicide', 'what causes suicide', 'what are the signs',
  'what are warning signs', 'how common is suicide', 'how many people',
  'tell me about suicide', 'explain suicide', 'define suicide',
  'information about suicide', 'facts about suicide',
  'statistics on suicide', 'research on suicide', 'studies on suicide',
  'article about suicide', 'essay about suicide', 'assignment about',
  'paper on suicide', 'study on suicide', 'documentary about',
  'book about suicide', 'movie about suicide', 'film about suicide',
  'good or bad', 'right or wrong', 'sin or not', 'haram or halal',
  'is it wrong to', 'is it bad to', 'is it a sin',
  'should i be worried about', 'how do i help someone',
  'what should i do if someone', 'how can i help',
  'signs of suicidal', 'warning signs of', 'signs that someone',
  'suicide prevention', 'prevent suicide', 'stopping suicide',
  'suicide awareness', 'mental health awareness', 'mental health topic',
  'talking about suicide', 'discuss suicide', 'understanding suicide',
  'is it possible that', 'could someone', 'can someone',
  'do people feel', 'do you think suicide', 'what do you think about',
  'opinion on suicide', 'thoughts on suicide', 'view on suicide',
  'types of suicide', 'causes of suicide', 'effects of suicide',
  'history of suicide', 'rate of suicide', 'suicide statistics',
  'suicide rate', 'suicide hotline', 'suicide helpline',

  // ===== URDU / HINDI =====
  'kya khudkushi', 'khudkushi kyun', 'khudkushi kya hai',
  'khudkushi ke baare mein', 'khudkushi ki wajah', 'khudkushi ke karan',
  'suicide kya hota hai', 'aatmahatya kya', 'aatmahatya kyun',
  'kya ye sahi hai', 'sahi ya galat', 'theek hai ya nahi',
  'kisi ki madad kaise', 'kisi ko bachana', 'lakshan kya hain',
  'signs kya hain', 'suicide se rokna', 'khudkushi rokna',
  'khudkushi ke baare', 'kya main madad kar sakta',
  'kya main madad kar sakti', 'kisi aur ke liye',
  'suicide ki wajah kya', 'khudkushi ki wajah kya',
  'aatmahatya ke karan', 'khudkushi kaise rokein',
  'meri research', 'mera essay', 'mera assignment',
  'padhna chahta hoon', 'padhna chahti hoon',
  'jaanna chahta hoon', 'jaanna chahti hoon',
  'samajhna chahta', 'samajhna chahti',
  'khudkushi kya hoti hai', 'suicide kya hai',
  'khudkushi gunah hai kya', 'kya ye haram hai',

  // ===== SPANISH =====
  'es el suicidio', 'por qué la gente', 'por qué alguien',
  'qué es el suicidio', 'qué causa el suicidio',
  'señales de suicidio', 'prevención del suicidio',
  'información sobre el suicidio', 'bueno o malo',
  'cómo ayudar a alguien', 'cómo puedo ayudar',
  'signos de suicidio', 'qué debo hacer si',
  'mi ensayo sobre', 'mi investigación sobre',

  // ===== FRENCH =====
  'est-ce que le suicide', 'pourquoi les gens', 'pourquoi quelqu\'un',
  'qu\'est-ce que le suicide', 'ce qui cause le suicide',
  'signes de suicide', 'prévention du suicide', 'bon ou mauvais',
  'comment aider quelqu\'un', 'comment puis-je aider',

  // ===== ARABIC =====
  'هل الانتحار', 'لماذا ينتحر', 'ما هو الانتحار',
  'علامات الانتحار', 'منع الانتحار', 'أسباب الانتحار',
  'كيف أساعد', 'كيف يمكنني مساعدة',

  // ===== GERMAN =====
  'ist suizid', 'warum begehen menschen', 'warum würde jemand',
  'was ist suizid', 'was verursacht suizid',
  'zeichen von suizid', 'suizidprävention', 'gut oder schlecht',
  'wie kann ich jemandem helfen',

  // ===== PORTUGUESE =====
  'o suicídio é', 'por que as pessoas', 'por que alguém',
  'o que é suicídio', 'o que causa suicídio',
  'sinais de suicídio', 'prevenção do suicídio',
  'como ajudar alguém', 'bom ou ruim',

  // ===== TURKISH =====
  'intihar nedir', 'neden insanlar intihar', 'neden biri intihar',
  'intihar iyi mi', 'intihar önleme', 'intiharın belirtileri',
  'birine nasıl yardım', 'araştırmam',
];

/**
 * Returns true for informational/educational questions about suicide.
 * These should NEVER trigger crisis responses.
 */
export const isInformationalQuery = (text: string): boolean => {
  const lower = text.toLowerCase().trim();

  for (const indicator of INFORMATIONAL_INDICATORS) {
    if (lower.includes(indicator)) return true;
  }

  // Short questions (ending with ?) without explicit first-person self-harm verbs
  // are almost certainly educational questions, not crisis statements.
  const SELF_HARM_VERBS = [
    'want to kill', 'going to kill', 'will kill', 'plan to kill',
    'want to die', 'going to die', 'want to end my', 'want to hurt myself',
    'want to harm myself', 'want to cut myself', 'am cutting', 'have cut myself',
    'marna chahta', 'marna chahti', 'khudkushi karna chahta', 'khudkushi karna chahti',
    'quiero matarme', 'voy a suicidarme', 'je veux me tuer',
    'ich will mich töten', 'voglio suicidarmi', 'kendimi öldürmek',
  ];

  const hasSelfHarmVerb = SELF_HARM_VERBS.some(v => lower.includes(v));
  if (!hasSelfHarmVerb && lower.endsWith('?') && lower.length < 150) {
    return true;
  }

  return false;
};

// ============================================================
// SELF-REFERENTIAL INDICATORS
// Only trigger crisis when the user speaks about THEMSELVES.
// ============================================================
const SELF_REFERENTIAL_INDICATORS = [
  // English
  'i want', 'i am', "i'm", 'i will', 'i have', 'i feel', 'i need',
  'i plan', 'i decided', "i've", 'i do', "i can't", 'i cannot',
  'myself', 'my life', 'my pain', 'my death', ' me ',
  'i just', 'i keep', 'i know', 'i think about',
  // Urdu / Hindi
  'main ', 'mn ', 'mujhe', 'meri ', 'mere ', 'mera ',
  'apne aap ko', 'khud ko', 'apni zindagi', 'meri zindagi',
  'main chahti', 'main chahta', 'mn chahti', 'mn chahta',
  'mujhe marna', 'mujhe jeena',
  // Spanish
  'yo quiero', 'yo voy', 'yo he', 'yo soy', 'me quiero',
  'mi vida', 'yo me',
  // French
  'je veux', 'je vais', "j'ai", 'je suis', 'je me',
  'ma vie',
  // Arabic
  'أنا', 'أريد', 'سأ', 'لدي', 'أشعر', 'حياتي', 'نفسي',
  // Portuguese
  'eu quero', 'eu vou', 'eu tenho', 'eu sou',
  'minha vida',
  // German
  'ich will', 'ich werde', 'ich habe', 'ich bin', 'ich fühle',
  'mein leben', 'mich selbst',
  // Italian
  'voglio', 'la mia vita', 'me stesso', 'me stessa',
  // Turkish
  'ben ', 'kendim', 'benim hayatım', 'istiyorum', 'yapacağım',
  // Russian
  'я ', 'себя', 'моя жизнь', 'мне ',
  // Bengali
  'ami ', 'amar ', 'nijer', 'amake',
  // Punjabi
  'apne aap nu',
];

// Third-person indicators — message is about someone ELSE
const THIRD_PERSON_INDICATORS = [
  // English
  'my friend', 'my brother', 'my sister', 'my mother', 'my father',
  'my mom', 'my dad', 'my son', 'my daughter', 'my cousin',
  'my colleague', 'my classmate', 'my teacher', 'my husband', 'my wife',
  'someone i know', 'a person i know', 'someone else',
  'he wants', 'she wants', 'they want',
  'he said', 'she said', 'they said', 'he told me', 'she told me',
  'my neighbor', 'my relative', 'my uncle', 'my aunt',
  'a friend of mine', 'one of my friends',
  'her friend', 'his friend',
  // Urdu / Hindi
  'mera dost', 'meri saheli', 'mera bhai', 'meri behan',
  'meri ammi', 'mere abbu', 'meri ami', 'mere walid',
  'mera beta', 'meri beti',
  'koi aur', 'ek aur', 'doosra', 'doosri',
  'woh chahta', 'woh chahti', 'usne kaha', 'usne btaya',
  'mere dost ne', 'meri friend ne',
  'mera shohar', 'meri biwi', 'mera rishtedaar',
  // Spanish
  'mi amigo', 'mi amiga', 'mi hermano', 'mi hermana',
  'mi madre', 'mi padre', 'mi hijo', 'mi hija',
  'alguien que conozco', 'otra persona', 'él quiere', 'ella quiere',
  // French
  'mon ami', 'mon amie', 'mon frère', 'ma sœur',
  'ma mère', 'mon père', 'il veut', 'elle veut',
  // Arabic
  'صديقي', 'أخي', 'أختي', 'أمي', 'أبي',
  'هو يريد', 'هي تريد',
  // German
  'mein freund', 'meine freundin', 'mein bruder', 'meine schwester',
  'er will', 'sie will',
  // Turkish
  'arkadaşım', 'kardeşim', 'annem', 'babam', 'o istiyor',
  // Bengali
  'amar bondo', 'amar bhai', 'amar bon', 'amar ma', 'amar baba',
  'onyo keu', 'se chai',
  // Punjabi
  'mera yaar', 'mera veer', 'meri maa', 'mera pita', 'koi hor',
];

/**
 * Returns true ONLY when the message clearly refers to the user themselves.
 * Third-person indicators take precedence — returns false for "my friend wants to die".
 * Conservative default: ambiguous messages return false (safer than false positives).
 */
export const isAboutSelf = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();

  for (const t of THIRD_PERSON_INDICATORS) {
    if (t && lower.includes(t)) return false;
  }
  for (const s of SELF_REFERENTIAL_INDICATORS) {
    if (s && lower.includes(s)) return true;
  }
  return false;
};

// ============================================================
// PATTERN LISTS — full phrases only, no single ambiguous words
// ============================================================
const ENHANCED_SUICIDE_PATTERNS = {
  direct: [
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
    'i want to burn myself', 'i hit myself', 'i want to hit myself',
    'i want to injure myself', 'i am self harming', 'i self harm', 'i want to self harm',
    'i want to starve myself', 'i am starving myself', 'i want to punish myself',
    'i deserve pain', 'i deserve to be hurt', 'i want to feel pain', 'i need to feel pain',
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
    'je veux me blesser', 'je me fais du mal', "je mérite d'avoir mal",
    // Arabic
    'أريد أن أنهي حياتي', 'سأنتحر', 'أريد أن أموت',
    'أريد إيذاء نفسي', 'أجرح نفسي', 'أستحق الألم',
    // Portuguese
    'quero me matar', 'vou me suicidar', 'quero acabar com minha vida',
    'não aguento mais viver', 'não quero mais viver',
    'quero me machucar', 'mereço dor',
    // German
    'ich will mich töten', 'ich werde mich umbringen', 'ich will mein leben beenden',
    'ich kann nicht mehr leben', 'ich will nicht mehr leben',
    'ich will mir wehtun', 'ich verdiene schmerzen',
    // Italian
    'voglio suicidarmi', 'non posso più vivere', 'voglio morire', 'non voglio più vivere',
    'voglio farmi del male', 'merito di soffrire',
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
  ],

  indirect: [
    "i can't go on anymore", "there's no point in living",
    'everyone would be better without me', 'i feel like giving up on life',
    "i don't see a way out of this", 'i feel completely trapped',
    'nothing will ever get better for me', 'i am a burden to everyone',
    'i just want the pain to stop forever',
    // Urdu
    'zindagi ka koi matlab nahi mujhe', 'sab log bina mere behtar honge',
    'main haar maan gayi hoon zindagi se', 'main haar maan gaya hoon zindagi se',
  ],

  // Methods only score when paired with intent verb — prevents false positives
  methods: [
    'pills to take my life', 'rope to hang myself', 'gun to kill myself',
    'knife to hurt myself', 'overdose to die', 'poison to kill myself',
    'jump off a bridge to die', 'blade to cut myself to die',
    'zehar pee kar marna', 'rassi se latakna to die', 'chhuri se kaatna to die',
  ],

  temporal: [
    'tonight is my last', 'very soon i will end', 'this is my last message',
    'final goodbye', "won't be here tomorrow", "won't wake up tomorrow",
    'aaj raat meri aakhri raat', 'yeh meri aakhri',
    'esta noche es mi última', 'ce soir est ma dernière',
    'heute nacht ist meine letzte',
  ],

  emotional_distress: [
    'hopeless and want to die', 'worthless and suicidal', 'empty inside and want to end it',
    'completely broken and want to die', 'completely alone and want to die',
    'be umeed hoon aur marna chahta hoon', 'bilkul akeli hoon aur jeena nahi chahti',
  ],
};

const INTENT_VERBS = [
  'want to', 'going to', 'will use', 'plan to', 'decided to',
  'using a', 'use a', 'got a', 'get a', 'overdose on', 'swallow',
  'se khatam', 'se maarna', 'se kaatna', 'se latakna',
  'lena chahta', 'lena chahti',
  'quiero usar', 'voy a usar', 'veux utiliser', 'vais utiliser',
  'will benutzen', 'kullanmak istiyorum',
];

class EnhancedSuicideDetector {
  private calculatePatternScore(text: string): { score: number; matchedPatterns: string[]; } {
    const lower = text.toLowerCase();
    let score = 0;
    const matchedPatterns: string[] = [];

    for (const p of ENHANCED_SUICIDE_PATTERNS.direct) {
      if (lower.includes(p)) { score += 10; matchedPatterns.push(`Direct: "${p}"`); }
    }
    for (const p of ENHANCED_SUICIDE_PATTERNS.indirect) {
      if (lower.includes(p)) { score += 6; matchedPatterns.push(`Indirect: "${p}"`); }
    }

    const hasIntentVerb = INTENT_VERBS.some(v => lower.includes(v));
    for (const m of ENHANCED_SUICIDE_PATTERNS.methods) {
      if (lower.includes(m) && hasIntentVerb) { score += 8; matchedPatterns.push(`Method+intent: "${m}"`); }
    }
    for (const t of ENHANCED_SUICIDE_PATTERNS.temporal) {
      if (lower.includes(t)) { score += 7; matchedPatterns.push(`Temporal: "${t}"`); }
    }
    for (const e of ENHANCED_SUICIDE_PATTERNS.emotional_distress) {
      if (lower.includes(e)) { score += 5; matchedPatterns.push(`Distress: "${e}"`); }
    }
    return { score, matchedPatterns };
  }

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 15) return 'critical';
    if (score >= 10) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }

  private getRecommendedAction(riskLevel: string): string {
    switch (riskLevel) {
      case 'critical': return 'IMMEDIATE INTERVENTION REQUIRED: Contact emergency services (911) or crisis hotline (988).';
      case 'high': return 'URGENT: Contact mental health professional immediately.';
      case 'medium': return 'MONITOR CLOSELY: Schedule mental health assessment.';
      default: return 'Continue supportive conversation.';
    }
  }

  public async analyzeSuicideRisk(text: string, context?: ConversationContext): Promise<SuicideRiskAnalysis> {
    // STEP 1: Informational queries never trigger crisis
    if (isInformationalQuery(text)) {
      return {
        riskLevel: 'low', confidence: 0, riskFactors: [], contextualCues: ['Informational query'],
        mcpClassification: false,
        recommendedAction: 'Respond with educational information. Do not trigger crisis response.',
        flagged: false, reason: 'Informational query detected',
      };
    }

    // STEP 2: Third-party messages don't trigger self-crisis
    if (!isAboutSelf(text)) {
      return {
        riskLevel: 'low', confidence: 0, riskFactors: [], contextualCues: ['Third-party reference'],
        mcpClassification: false,
        recommendedAction: 'Offer guidance on supporting the person they are talking about.',
        flagged: false, reason: 'Third-party reference detected',
      };
    }

    // STEP 3: Full pattern analysis
    const basicCheck = checkContent(text);
    const { score, matchedPatterns } = this.calculatePatternScore(text);
    const riskLevel = this.determineRiskLevel(score);
    const confidence = Math.min((score / 20) * 0.9 + (basicCheck.flagged ? 0.1 : 0), 1.0);

    const analysis: SuicideRiskAnalysis = {
      riskLevel, confidence,
      riskFactors: matchedPatterns,
      contextualCues: [],
      mcpClassification: false,
      recommendedAction: this.getRecommendedAction(riskLevel),
      flagged: riskLevel !== 'low' || basicCheck.flagged,
      reason: basicCheck.reason || 'Suicide/self-harm risk patterns detected',
    };

    if (riskLevel === 'high' || riskLevel === 'critical') {
      this.logHighRiskCase(text, analysis, context);
    }

    return analysis;
  }

  private logHighRiskCase(text: string, analysis: SuicideRiskAnalysis, context?: ConversationContext) {
    console.error('HIGH RISK DETECTED:', {
      timestamp: new Date().toISOString(),
      userId: context?.userId || 'unknown',
      conversationId: context?.conversationId || 'unknown',
      messagePreview: text.substring(0, 80),
      riskAnalysis: analysis,
    });
  }
}

export const suicideDetector = new EnhancedSuicideDetector();

export const enhancedCheckContent = async (
  text: string,
  context?: ConversationContext
): Promise<SuicideRiskAnalysis> => suicideDetector.analyzeSuicideRisk(text, context);

export default {
  suicideDetector,
  enhancedCheckContent,
  isAboutSelf,
  isInformationalQuery,
};