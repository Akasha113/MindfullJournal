import { checkContent } from './contentMonitor';

// Enhanced RAG-based suicide detection with improved context awareness
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

// Enhanced suicide-related phrases with context patterns (English + Urdu)
const ENHANCED_SUICIDE_PATTERNS = {
  direct: [
    // English
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
    // Urdu
    'khudkushi karna chahti hoon',
    'khudkushi karna chahta hoon',
    'jaan lena chahti hoon',
    'jaan lena chahta hoon',
    'marna chahti hoon',
    'marna chahta hoon',
    'zindagi khatam karna chahti hoon',
    'zindagi khatam karna chahta hoon',
    'khud ko maarna chahti hoon',
    'khud ko maarna chahta hoon',
    'aaj raat meri aakhri raat hai',
    'kal mera aakhri din hai',
    'main marne ka faisla kar chuki hoon',
    'main marne ka faisla kar chuka hoon',
    'main khudkushi karne wali hoon',
    'main khudkushi karne wala hoon',
    'khudlushi karna chahti hoon', 'khudlushi karna chahta hoon',
    'khudkushi krna chahti hoon', 'khudkushi krna chahta hoon',
    'khudlushi krna chahti hoon', 'khudlushi krna chahta hoon',
    'jaan laina chahti hoon', 'jaan laina chahta hoon',
    'jaan lena chahti hon', 'jaan lena chahta hon',
    'jaan laina chahti hon', 'jaan laina chahta hon',
    'marna chahti hon', 'marna chahta hon',
    'zindagi khatam krna chahti hoon', 'zindagi khatam krna chahta hoon',
    'khud ko marna chahti hoon', 'khud ko marna chahta hoon',
    'khud ko khatam karna chahti hoon', 'khud ko khatam karna chahta hoon',
    'khud ko khatam krna chahti hoon', 'khud ko khatam krna chahta hoon',
    'khud ko khatam krna chahti hon', 'khud ko khatam krna chahta hon',
    'aaj raat meri aakhri raat', 'kal mera aakhri din',
    'main marne ka faisla kr chuki hoon', 'main marne ka faisla kr chuka hoon',
    'main khudlushi karne wali hoon', 'main khudlushi karne wala hoon',
    'main khudkushi krne wali hoon', 'main khudkushi krne wala hoon',
    'main khudlushi krne wali hoon', 'main khudlushi krne wala hoon'
  ],
  indirect: [
    // English
    'i can\'t go on anymore',
    'there\'s no point in living',
    'everyone would be better without me',
    'i feel like giving up',
    'life is too hard',
    'i don\'t see a way out',
    'i feel trapped',
    'nothing will ever get better',
    'i am a burden to everyone',
    'i just want the pain to stop',
    // Urdu
    'zindagi se tang aa gayi hoon',
    'zindagi se tang aa gaya hoon',
    'zindagi ka koi matlab nahi',
    'sab log bina mere behtar honge',
    'main haar maan gayi hoon',
    'main haar maan gaya hoon',
    'zindagi bahut mushkil hai',
    'koi raasta nahi dikhta',
    'main phas gayi hoon',
    'main phas gaya hoon',
    'kabhi kuch behtar nahi hoga',
    'main sab ki bojh hoon',
    'dard khatam karna chahti hoon',
    'dard khatam karna chahta hoon',
    'sab kuch khatam kar doon',
    'zindagi se nikalna chahti hoon',
    'zindagi se nikalna chahta hoon'
  ],
  methods: [
    // English
    'pills', 'rope', 'bridge', 'gun', 'knife', 'overdose',
    'hanging', 'jumping', 'drowning', 'cutting', 'poison',
    // Urdu
    'goli', 'rassee', 'pul', 'bandook', 'chaku', 'dawai',
    'latakna', 'koodna', 'dubna', 'kaatna', 'zehar',
    'dawai ki over dose', 'khud ko kaatna', 'khud ko jalan'
  ],
  temporal: [
    // English
    'tonight', 'today', 'tomorrow', 'this weekend', 'soon',
    'when i get home', 'after this', 'in the morning',
    // Urdu
    'aaj raat', 'aaj', 'kal', 'is hafte', 'jaldi',
    'jab ghar pahunchun', 'iske baad', 'subah',
    'abhi', 'foran', 'turant', 'bahut jaldi'
  ],
  emotional_distress: [
    // English
    'hopeless', 'worthless', 'empty', 'numb', 'broken',
    'alone', 'abandoned', 'rejected', 'failure', 'useless',
    // Urdu
    'be umeed', 'bekar', 'khali', 'sunn', 'tota',
    'akeli', 'akela', 'chhoda gaya', 'rad kar diya',
    'naakam', 'lafanga', 'laachaar', 'bebas',
    'dukhi', 'pareshan', 'ghamgin', 'udass'
  ]
};

// Context-aware risk assessment patterns (English + Urdu)
const CONTEXTUAL_RISK_INDICATORS = {
  isolation: [
    // English
    'no one cares', 'all alone', 'nobody understands', 'no friends',
    // Urdu
    'koi care nahi karta', 'bilkul akeli', 'bilkul akela', 'koi samajhta nahi',
    'koi dost nahi', 'sab mujhe chhod gaye', 'koi mere saath nahi'
  ],
  plan_formation: [
    // English
    'i have thought about', 'i have been planning', 'i know exactly how',
    // Urdu
    'main soch chuki hoon', 'main soch chuka hoon', 'main plan bana rahi hoon',
    'main plan bana raha hoon', 'main jaanti hoon kaise', 'main jaanta hoon kaise',
    'mujhe pata hai kaise karna hai'
  ],
  means_access: [
    // English
    'i have access to', 'i can get', 'i already have',
    // Urdu
    'mere paas hai', 'main la sakti hoon', 'main la sakta hoon', 'pehle se hi hai'
  ],
  timeline: [
    // English
    'very soon', 'tonight', 'today', 'this week',
    // Urdu
    'bahut jaldi', 'aaj raat', 'aaj', 'is hafte', 'abhi'
  ],
  finality: [
    // English
    'final decision', 'made up my mind', 'there\'s no going back', 'this is it',
    // Urdu
    'aakhri faisla', 'mujhe pata hai', 'ab wapas nahi ja sakti', 'ab wapas nahi ja sakta',
    'yahi hai', 'khudkushi karne ka faisla kar liya'
  ]
};

class EnhancedSuicideDetector {
  private knowledgeBase: string[] = [];

  constructor() {
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase() {
    // Mental health knowledge base for RAG (English + Urdu)
    this.knowledgeBase = [
      // English
      "Suicidal ideation often includes expressions of hopelessness, worthlessness, and desire to escape pain.",
      "Warning signs include talking about death, giving away possessions, social withdrawal, and mood changes.",
      "Risk factors include depression, anxiety, substance abuse, trauma, and social isolation.",
      "Immediate intervention is required when someone expresses a specific plan, means, and timeline.",
      "Crisis resources include National Suicide Prevention Lifeline: 988, Crisis Text Line: Text HOME to 741741.",
      "Professional help should be sought immediately for any suicidal thoughts or behaviors.",
      "Safety planning involves removing means, creating support networks, and identifying coping strategies.",
      "Recovery is possible with appropriate mental health treatment and support systems.",
      
      // Urdu
      "خودکشی کے خیالات میں اکثر ناامیدی، بےقدری اور درد سے بچنے کی خواہش شامل ہوتی ہے۔",
      "خطرے کے نشانات میں موت کے بارے میں بات کرنا، سامان دینا، سماجی پسپائی اور مزاج میں تبدیلی شامل ہے۔",
      "خطرے کے عوامل میں افسردگی، پریشانی، مادہ کی لت، صدمہ اور سماجی تنہائی شامل ہے۔",
      "جب کوئی مخصوص منصوبہ، ذرائع اور وقت کا اظہار کرے تو فوری مداخلت ضروری ہے۔",
      "کرائسس وسائل میں قومی خودکشی روک تھام لائف لائن: 988، کرائسس ٹیکسٹ لائن: ٹیکسٹ ہوم ٹو 741741 شامل ہے۔",
      "کسی بھی خودکشی کے خیالات یا رویوں کے لیے فوری طور پر پیشہ ورانہ مدد حاصل کی جانی چاہیے۔",
      "سیفٹی پلاننگ میں ذرائع کو ہٹانا، سپورٹ نیٹ ورک بنانا اور کاپنگ کی حکمت عملیوں کی نشاندہی شامل ہے۔",
      "مناسب ذہنی صحت کی علاج اور سپورٹ سسٹم کے ساتھ صحتیابی ممکن ہے۔",
      
      // Urdu-specific cultural context
      "اردو میں خودکشی کے اشارے: زندگی سے تنگ آ جانا، سب کچھ ختم کرنا، جان لینا چاہتی ہوں وغیرہ۔",
      "پاکستانی اور جنوبی ایشیائی ثقافت میں خودکشی کے خطرے کے نشانات: سماجی دباؤ، گھر گلی کی پریشانیاں، تعلیمی دباؤ۔",
      "اردو میں مدد کے لیے: چھپے ہوئے اشاروں پر توجہ دیں جیسے 'میں چلی جاؤں گی' یا 'سب کچھ ختم ہو جائے'۔"
    ];
  }

  private calculatePatternScore(text: string): { score: number; matchedPatterns: string[] } {
    const lowerText = text.toLowerCase();
    let score = 0;
    const matchedPatterns: string[] = [];

    // Direct suicide mentions (highest weight)
    for (const pattern of ENHANCED_SUICIDE_PATTERNS.direct) {
      if (lowerText.includes(pattern)) {
        score += 10;
        matchedPatterns.push(`Direct threat: "${pattern}"`);
      }
    }

    // Indirect expressions (medium-high weight)
    for (const pattern of ENHANCED_SUICIDE_PATTERNS.indirect) {
      if (lowerText.includes(pattern)) {
        score += 6;
        matchedPatterns.push(`Indirect indicator: "${pattern}"`);
      }
    }

    // Method mentions (high weight)
    for (const method of ENHANCED_SUICIDE_PATTERNS.methods) {
      if (lowerText.includes(method)) {
        score += 8;
        matchedPatterns.push(`Method reference: "${method}"`);
      }
    }

    // Temporal indicators (high weight)
    for (const temporal of ENHANCED_SUICIDE_PATTERNS.temporal) {
      if (lowerText.includes(temporal)) {
        score += 7;
        matchedPatterns.push(`Temporal indicator: "${temporal}"`);
      }
    }

    // Emotional distress (medium weight)
    for (const emotion of ENHANCED_SUICIDE_PATTERNS.emotional_distress) {
      if (lowerText.includes(emotion)) {
        score += 3;
        matchedPatterns.push(`Emotional distress: "${emotion}"`);
      }
    }

    return { score, matchedPatterns };
  }

  private analyzeContextualRisk(text: string, context?: ConversationContext): { score: number; contextualCues: string[] } {
    const lowerText = text.toLowerCase();
    let score = 0;
    const contextualCues: string[] = [];

    // Check for contextual risk indicators
    Object.entries(CONTEXTUAL_RISK_INDICATORS).forEach(([category, indicators]) => {
      indicators.forEach(indicator => {
        if (lowerText.includes(indicator)) {
          const weight = category === 'plan_formation' || category === 'means_access' ? 5 : 3;
          score += weight;
          contextualCues.push(`${category}: "${indicator}"`);
        }
      });
    });

    // Analyze conversation history for escalating patterns
    if (context) {
      const recentMessages = context.messages.slice(-5); // Last 5 messages
      const negativePatterns = recentMessages.filter(msg => 
        msg.role === 'user' && this.calculatePatternScore(msg.content).score > 0
      );

      if (negativePatterns.length >= 2) {
        score += 4;
        contextualCues.push('Escalating pattern detected in conversation history');
      }
    }

    return { score, contextualCues };
  }

  private async callMCPClassifier(text: string): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:8002/analyze_suicide_risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          conversation_id: 'current',
          user_id: 'current-user',
          context_messages: []
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.mcp_classification || false;
      }
    } catch {
      console.warn('Enhanced RAG API unavailable, using fallback detection');
    }
    return false;
  }

  private determineRiskLevel(score: number, mcpPositive: boolean): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 15 || mcpPositive) return 'critical';
    if (score >= 10) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }

  private getRecommendedAction(riskLevel: string): string {
    switch (riskLevel) {
      case 'critical':
        return 'IMMEDIATE INTERVENTION REQUIRED: Contact emergency services (911) or crisis hotline (988). Do not leave person alone.';
      case 'high':
        return 'URGENT: Contact mental health professional immediately. Consider safety planning and crisis resources.';
      case 'medium':
        return 'MONITOR CLOSELY: Schedule mental health assessment. Provide crisis resources and support.';
      case 'low':
        return 'PREVENTIVE: Continue supportive conversation. Monitor for changes in mood or expression.';
      default:
        return 'Continue monitoring and provide supportive resources.';
    }
  }

  public async analyzeSuicideRisk(
    text: string, 
    context?: ConversationContext
  ): Promise<SuicideRiskAnalysis> {
    // Use existing content monitor as baseline
    const basicCheck = checkContent(text);
    
    // Enhanced pattern analysis
    const patternAnalysis = this.calculatePatternScore(text);
    const contextualAnalysis = this.analyzeContextualRisk(text, context);
    
    // MCP classifier integration
    const mcpClassification = await this.callMCPClassifier(text);
    
    // Calculate total risk score
    const totalScore = patternAnalysis.score + contextualAnalysis.score;
    const riskLevel = this.determineRiskLevel(totalScore, mcpClassification);
    
    // Calculate confidence based on multiple factors
    const confidence = Math.min(
      (totalScore / 20) * 0.7 + 
      (mcpClassification ? 0.3 : 0) + 
      (basicCheck.flagged ? 0.2 : 0), 
      1.0
    );

    const analysis: SuicideRiskAnalysis = {
      riskLevel,
      confidence,
      riskFactors: patternAnalysis.matchedPatterns,
      contextualCues: contextualAnalysis.contextualCues,
      mcpClassification,
      recommendedAction: this.getRecommendedAction(riskLevel),
      flagged: riskLevel !== 'low' || basicCheck.flagged,
      reason: basicCheck.reason || 'Enhanced suicide risk patterns detected'
    };

    // Log high-risk cases for admin review
    if (riskLevel === 'high' || riskLevel === 'critical') {
      this.logHighRiskCase(text, analysis, context);
    }

    return analysis;
  }

  private async logHighRiskCase(
    text: string, 
    analysis: SuicideRiskAnalysis, 
    context?: ConversationContext
  ) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: context?.userId || 'unknown',
      conversationId: context?.conversationId || 'unknown',
      messageContent: text,
      riskAnalysis: analysis,
      requiresImmediateAttention: analysis.riskLevel === 'critical'
    };

    // Store in admin flagged content (integrate with existing storage system)
    try {
      // This would integrate with your existing storage system
      console.error('HIGH RISK SUICIDE CASE DETECTED:', logEntry);
      
      // In a real implementation, you would:
      // 1. Store in database for admin review
      // 2. Send immediate alerts to mental health professionals
      // 3. Trigger crisis intervention protocols
      // 4. Log for compliance and follow-up
      
    } catch (_error) {
      console.error('Failed to log high-risk case:', _error);
    }
  }
}

// Singleton instance
export const suicideDetector = new EnhancedSuicideDetector();

// Enhanced content monitoring function that integrates with RAG
export const enhancedCheckContent = async (
  text: string, 
  context?: ConversationContext
): Promise<SuicideRiskAnalysis> => {
  return await suicideDetector.analyzeSuicideRisk(text, context);
};

export default {
  suicideDetector,
  enhancedCheckContent,
  ENHANCED_SUICIDE_PATTERNS,
  CONTEXTUAL_RISK_INDICATORS
};
