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

// ============================================================
// SELF-REFERENTIAL INDICATORS
// Only trigger crisis response when user is talking about THEMSELVES
// NOT when talking about someone else ("mera dost", "my friend", etc.)
// ============================================================
const SELF_REFERENTIAL_INDICATORS = [
  // ===== ENGLISH =====
  'i want', 'i am', 'i\'m', 'i will', 'i have', 'i feel', 'i need',
  'i plan', 'i decided', 'i\'ve', 'i do', 'i can\'t', 'i cannot',
  'myself', 'my life', 'my pain', 'my death', 'me ',
  'i just', 'i keep', 'i keep', 'i know', 'i think about',

  // ===== URDU / HINDI =====
  'main ', 'mn ', 'mujhe', 'meri ', 'mere ', 'mera ',
  'apne aap ko', 'khud ko', 'apni zindagi', 'meri zindagi',
  'main chahti', 'main chahta', 'mn chahti', 'mn chahta',
  'mujhe marna', 'mujhe jeena', 'meri taraf', 'apna',

  // ===== SPANISH =====
  'yo quiero', 'yo voy', 'yo he', 'yo soy', 'me quiero',
  'mi vida', 'mi dolor', 'yo me', 'a mí mismo', 'a mí misma',

  // ===== FRENCH =====
  'je veux', 'je vais', 'j\'ai', 'je suis', 'je me',
  'ma vie', 'ma douleur', 'moi-même',

  // ===== ARABIC =====
  'أنا', 'أريد', 'سأ', 'لدي', 'أشعر', 'حياتي', 'نفسي',

  // ===== PORTUGUESE =====
  'eu quero', 'eu vou', 'eu tenho', 'eu sou', 'me ',
  'minha vida', 'minha dor', 'eu mesmo', 'eu mesma',

  // ===== GERMAN =====
  'ich will', 'ich werde', 'ich habe', 'ich bin', 'ich fühle',
  'mein leben', 'mein schmerz', 'mich selbst',

  // ===== ITALIAN =====
  'voglio', 'andrò', 'ho ', 'sono ', 'mi ',
  'la mia vita', 'il mio dolore', 'me stesso', 'me stessa',

  // ===== TURKISH =====
  'ben ', 'kendim', 'benim hayatım', 'istiyorum', 'yapacağım',

  // ===== RUSSIAN =====
  'я ', 'себя', 'моя жизнь', 'мне ', 'мой ',

  // ===== BENGALI =====
  'ami ', 'amar ', 'nijer', 'amake', 'amii',

  // ===== PUNJABI =====
  'main ', 'mera ', 'meri ', 'apne aap nu', 'apna ',
];

// Third-person indicators — if these appear, it's about someone ELSE
// Do NOT trigger crisis response
const THIRD_PERSON_INDICATORS = [
  // ===== ENGLISH =====
  'my friend', 'my brother', 'my sister', 'my mother', 'my father',
  'my mom', 'my dad', 'my son', 'my daughter', 'my cousin',
  'my colleague', 'my classmate', 'my teacher', 'my husband', 'my wife',
  'someone i know', 'a person i know', 'someone else',
  'he wants', 'she wants', 'they want', 'he is going to', 'she is going to',
  'he said', 'she said', 'they said', 'he told me', 'she told me',
  'my neighbor', 'my relative', 'my uncle', 'my aunt',
  'a friend of mine', 'one of my friends',

  // ===== URDU / HINDI =====
  'mera dost', 'meri saheli', 'mera bhai', 'meri behan',
  'meri ammi', 'mere abbu', 'meri ami', 'mere walid',
  'mera beta', 'meri beti', 'mera cousine', 'meri cousine',
  'koi aur', 'ek aur', 'doosra', 'doosri',
  'woh chahta', 'woh chahti', 'usne kaha', 'usne btaya',
  'mere dost ne', 'meri friend ne', 'meri teacher ne',
  'mere bhai ne', 'meri behan ne',
  'kisi ne mujhe btaya', 'kisi ne kaha',
  'mera shohar', 'meri biwi', 'mera rishtedaar',

  // ===== SPANISH =====
  'mi amigo', 'mi amiga', 'mi hermano', 'mi hermana',
  'mi madre', 'mi padre', 'mi hijo', 'mi hija',
  'alguien que conozco', 'otra persona', 'él quiere', 'ella quiere',
  'mi esposo', 'mi esposa', 'mi vecino', 'mi vecina',

  // ===== FRENCH =====
  'mon ami', 'mon amie', 'mon frère', 'ma sœur',
  'ma mère', 'mon père', 'mon fils', 'ma fille',
  'quelqu\'un que je connais', 'quelqu\'un d\'autre',
  'il veut', 'elle veut', 'mon mari', 'ma femme',

  // ===== ARABIC =====
  'صديقي', 'أخي', 'أختي', 'أمي', 'أبي',
  'ابني', 'ابنتي', 'شخص آخر', 'هو يريد', 'هي تريد',
  'زوجي', 'زوجتي', 'جاري',

  // ===== PORTUGUESE =====
  'meu amigo', 'minha amiga', 'meu irmão', 'minha irmã',
  'minha mãe', 'meu pai', 'meu filho', 'minha filha',
  'alguém que conheço', 'outra pessoa', 'ele quer', 'ela quer',

  // ===== GERMAN =====
  'mein freund', 'meine freundin', 'mein bruder', 'meine schwester',
  'meine mutter', 'mein vater', 'jemand anderes', 'er will', 'sie will',

  // ===== ITALIAN =====
  'il mio amico', 'la mia amica', 'mio fratello', 'mia sorella',
  'mia madre', 'mio padre', 'qualcun altro', 'lui vuole', 'lei vuole',

  // ===== TURKISH =====
  'arkadaşım', 'kardeşim', 'annem', 'babam',
  'oğlum', 'kızım', 'başka biri', 'o istiyor',

  // ===== BENGALI =====
  'amar bondo', 'amar bhai', 'amar bon', 'amar ma', 'amar baba',
  'amar chele', 'amar meye', 'onyo keu', 'se chai',

  // ===== PUNJABI =====
  'mera yaar', 'meri saheli', 'mera veer', 'meri pen',
  'meri maa', 'mera pita', 'koi hor',
];

/**
 * KEY FUNCTION: Checks if the message is about the USER THEMSELVES
 * Returns true = about self (trigger crisis check)
 * Returns false = about someone else (skip crisis check)
 */
const isAboutSelf = (text: string): boolean => {
  const lowerText = text.toLowerCase();

  // If message contains third-person indicators → it's about someone else
  for (const indicator of THIRD_PERSON_INDICATORS) {
    if (lowerText.includes(indicator.toLowerCase())) {
      return false;
    }
  }

  // If message contains self-referential indicators → it's about self
  for (const indicator of SELF_REFERENTIAL_INDICATORS) {
    if (lowerText.includes(indicator.toLowerCase())) {
      return true;
    }
  }

  // Default: if unclear, treat as self-referential to be safe
  return true;
};

// Enhanced suicide & self-harm patterns (Multiple Languages)
const ENHANCED_SUICIDE_PATTERNS = {
  direct: [
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
    'everyone would be better without me',
    'no reason to live',
    'nothing to live for',
    'i want to stop existing',
    'life is not worth living',
    'i cant take it anymore',
    'i can\'t take it anymore',
    'this is my last message',
    'goodbye forever',
    'i have made up my mind to die',
    'i will end my suffering',
    'i want to jump',
    'i want to overdose',
    'i have pills ready',
    'i have a gun',
    'i have a knife ready',

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
    'i deserve pain',
    'i deserve to be hurt',
    'i want to feel pain',
    'i need to feel pain',

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
    'mujhe marna hai',
    'main mar jaana chahti hoon',
    'main mar jaana chahta hoon',
    'zindagi se tang aa gayi hoon',
    'zindagi se tang aa gaya hoon',

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
    'dard chahiye mujhe',
    'mujhe saza milni chahiye',
    'main apne aap ko saza dena chahti hoon',
    'main apne aap ko saza dena chahta hoon',

    // ===== SPANISH — Suicide =====
    'quiero matarme',
    'voy a suicidarme',
    'planeo terminar mi vida',
    'he decidido morir',
    'quiero acabar con esto',
    'no aguanto más la vida',
    'quiero dejar de existir',
    'no quiero seguir viviendo',
    'ya no quiero vivir',

    // ===== SPANISH — Self-Harm =====
    'quiero hacerme daño',
    'me quiero cortar',
    'me estoy cortando',
    'quiero lastimarme',
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

    // ===== ARABIC — Self-Harm =====
    'أريد إيذاء نفسي',
    'أريد جرح نفسي',
    'أجرح نفسي',
    'أريد أن أتألم',
    'أستحق الألم',
    'أريد أن أحرق نفسي',

    // ===== PORTUGUESE — Suicide =====
    'quero me matar',
    'vou me suicidar',
    'quero acabar com minha vida',
    'não aguento mais viver',
    'não quero mais viver',

    // ===== PORTUGUESE — Self-Harm =====
    'quero me machucar',
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

    // ===== GERMAN — Self-Harm =====
    'ich will mir wehtun',
    'ich verletze mich selbst',
    'ich will mich schneiden',
    'ich schneide mich',
    'ich verdiene schmerzen',
    'ich brauche schmerzen',
    'ich will mich verbrennen',

    // ===== ITALIAN — Suicide =====
    'voglio suicidarmi',
    'vado a togliermi la vita',
    'non posso più vivere',
    'voglio morire',
    'non voglio più vivere',

    // ===== ITALIAN — Self-Harm =====
    'voglio farmi del male',
    'mi faccio del male',
    'voglio tagliarmi',
    'mi taglio',
    'merito di soffrire',
    'voglio bruciarmi',

    // ===== HINDI — Suicide =====
    'main apne aap ko maarna chahta hoon',
    'main aatmahatya karna chahta hoon',
    'mujhe jeena nahi hai',
    'zindagi se thak gaya hoon',
    'main mar jaana chahta hoon',
    'mujhe marna hai',

    // ===== HINDI — Self-Harm =====
    'main apne aap ko takleef dena chahta hoon',
    'main khud ko zakhmi karna chahta hoon',
    'mujhe dard chahiye',
    'main saza chahta hoon apne aap ko',
    'main khud ko jalana chahta hoon',

    // ===== BENGALI — Suicide =====
    'ami nij-deh poriksha korte chai',
    'ami jeeban sesh korte chai',
    'jeeban aro chalte parchhi na',
    'ami morte chai',
    'ami amar jibon sesh korte chai',

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

    // ===== RUSSIAN — Self-Harm =====
    'я хочу причинить себе вред',
    'я режу себя',
    'я хочу порезать себя',
    'я заслуживаю боли',
    'я наказываю себя',

    // ===== JAPANESE — Suicide =====
    '死にたい',
    '自殺したい',
    '消えてしまいたい',
    '生きていたくない',

    // ===== JAPANESE — Self-Harm =====
    '自分を傷つけたい',
    '自分を切りたい',
    '自傷している',
    '痛みを感じたい',
    '自分を罰したい',

    // ===== CHINESE — Suicide =====
    '我想死',
    '我要自杀',
    '我想结束生命',
    '我不想活了',

    // ===== CHINESE — Self-Harm =====
    '我想伤害自己',
    '我想割自己',
    '我在割自己',
    '我应该受苦',
    '我想惩罚自己',

    // ===== KOREAN — Suicide =====
    '죽고 싶다',
    '자살하고 싶다',
    '사라지고 싶다',
    '더 이상 살고 싶지 않다',

    // ===== KOREAN — Self-Harm =====
    '나 자신을 다치게 하고 싶다',
    '나를 자르고 싶다',
    '고통을 느끼고 싶다',
    '나는 벌을 받아야 해',

    // ===== PUNJABI — Suicide =====
    'main apne aap nu maarna chahunda haan',
    'main khatam ho jaana chahunda haan',
    'mujhe jeona nahi',
    'main mar jaana chahunda haan',

    // ===== PUNJABI — Self-Harm =====
    'main apne aap nu takleef dena chahunda haan',
    'main khud nu zakhmi karna chahunda haan',
    'mujhe dard chahida hai',
    'main saza chahunda haan apne aap nu',
  ],
  indirect: [
    // ===== ENGLISH =====
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

    // ===== URDU =====
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

    // ===== SPANISH =====
    'no puedo seguir',
    'no hay razón para vivir',
    'todos estarían mejor sin mí',
    'quiero rendirme',
    'me siento atrapado',
    'nunca mejorará',
    'soy una carga para todos',

    // ===== FRENCH =====
    'je ne peux pas continuer',
    'il n\'y a pas de raison de vivre',
    'tout le monde serait mieux sans moi',
    'je veux abandonner',
    'je me sens piégé',
    'rien n\'ira jamais mieux',
    'je suis un fardeau pour tout le monde',

    // ===== ARABIC =====
    'لا يمكنني المتابعة',
    'لا فائدة من العيش',
    'الجميع سيكونون أفضل بدوني',
    'أنا محاصر',
    'أنا عبء على الجميع',

    // ===== GERMAN =====
    'ich kann nicht mehr',
    'alle wären besser ohne mich',
    'ich fühle mich gefangen',
    'es wird nie besser',
    'ich bin eine Last für alle',

    // ===== HINDI =====
    'main aur jee nahi sakta',
    'jeene ka koi matlab nahi',
    'main haar maan gaya hoon',
    'main fasa hoon',
    'main sab ke liye bojh hoon',

    // ===== TURKISH =====
    'devam edemiyorum',
    'herkes bensiz daha iyi olurdu',
    'çıkış yolu göremiyorum',
    'herkese yük oluyorum',
  ],
  methods: [
    // ===== ENGLISH =====
    'pills', 'rope', 'bridge', 'gun', 'knife', 'overdose',
    'hanging', 'jumping', 'drowning', 'cutting', 'poison',

    // ===== URDU =====
    'goli', 'rassee', 'pul', 'bandook', 'chaku', 'dawai',
    'latakna', 'koodna', 'dubna', 'kaatna', 'zehar',

    // ===== SPANISH =====
    'pastillas', 'cuerda', 'puente', 'arma', 'cuchillo', 'sobredosis',
    'ahorcamiento', 'saltar', 'veneno',

    // ===== FRENCH =====
    'pilules', 'corde', 'pont', 'couteau', 'overdose',
    'pendaison', 'sauter', 'poison',

    // ===== ARABIC =====
    'حبوب', 'حبل', 'جسر', 'سكين', 'جرعة زائدة', 'سم',

    // ===== GERMAN =====
    'pillen', 'seil', 'brücke', 'messer', 'überdosis', 'gift',

    // ===== HINDI =====
    'rassi', 'pul', 'chhuri', 'jahar', 'latakna', 'koodna', 'doobna',

    // ===== TURKISH =====
    'hap', 'ip', 'köprü', 'bıçak', 'zehir',
  ],
  temporal: [
    // ===== ENGLISH =====
    'tonight', 'very soon', 'this is my last',
    'final goodbye', 'last time', 'end is near',

    // ===== URDU =====
    'aaj raat', 'bahut jaldi', 'aakhri baar', 'yeh meri aakhri',
    'ant kareeb hai', 'aakhri alvida',

    // ===== SPANISH =====
    'esta noche', 'muy pronto', 'última vez', 'el fin está cerca',

    // ===== FRENCH =====
    'ce soir', 'très bientôt', 'dernière fois', 'la fin est proche',

    // ===== ARABIC =====
    'الليلة', 'قريباً جداً', 'آخر مرة', 'النهاية قريبة',

    // ===== GERMAN =====
    'heute nacht', 'sehr bald', 'das letzte mal', 'das ende ist nah',

    // ===== HINDI =====
    'aaj raat', 'bahut jaldi', 'aakhri baar', 'ant kareeb hai',

    // ===== TURKISH =====
    'bu gece', 'çok yakında', 'son kez', 'son yakın',
  ],
  emotional_distress: [
    // ===== ENGLISH =====
    'hopeless', 'worthless', 'empty', 'numb', 'broken',
    'alone', 'abandoned', 'rejected', 'failure', 'useless',

    // ===== URDU =====
    'be umeed', 'bekar', 'khali', 'sunn', 'tota hua',
    'akeli', 'akela', 'chhoda gaya', 'naakam', 'laachaar',
    'dukhi', 'pareshan', 'ghamgin', 'udass',

    // ===== SPANISH =====
    'desesperado', 'inútil', 'vacío', 'roto',
    'solo', 'abandonado', 'fracaso',

    // ===== ARABIC =====
    'يائس', 'عديم القيمة', 'فارغ', 'مكسور',
    'وحيد', 'مهجور', 'مرفوض', 'فشل',

    // ===== GERMAN =====
    'hoffnungslos', 'wertlos', 'leer', 'zerbrochen',
    'allein', 'verlassen', 'versagen',

    // ===== HINDI =====
    'nihasa', 'behkaar', 'khali', 'akela', 'naakam',
    'udas', 'pareshaan', 'dukhi',

    // ===== TURKISH =====
    'umutsuz', 'değersiz', 'boş', 'kırılmış',
    'yalnız', 'terk edilmiş', 'başarısız',
  ]
};

const CONTEXTUAL_RISK_INDICATORS = {
  isolation: [
    'no one cares', 'all alone', 'nobody understands', 'no friends',
    'koi care nahi karta', 'bilkul akeli', 'bilkul akela', 'koi samajhta nahi',
    'koi dost nahi', 'nadie se preocupa', 'personne ne s\'en soucie',
    'niemand kümmert sich', 'kimse umursamıyor',
  ],
  plan_formation: [
    'i have thought about', 'i have been planning', 'i know exactly how',
    'i\'ve made plans', 'everything is ready', 'i\'ve decided',
    'main soch chuki hoon', 'main plan bana rahi hoon', 'maine faisla kiya hai',
    'he pensado en ello', 'j\'ai décidé', 'ich habe entschieden',
  ],
  means_access: [
    'i have access to', 'i can get', 'i already have',
    'i possess', 'readily available',
    'mere paas hai', 'main la sakti hoon', 'main la sakta hoon',
    'tengo acceso a', 'j\'ai accès à', 'ich habe zugang zu',
  ],
  timeline: [
    'very soon', 'tonight', 'today', 'this week', 'final', 'last',
    'aaj raat', 'aaj', 'is hafte', 'aakhri',
    'esta noche', 'hoy', 'ce soir', 'heute nacht',
  ],
  finality: [
    'final decision', 'made up my mind', 'there\'s no going back', 'i\'m done',
    'no more chances', 'point of no return',
    'aakhri faisla', 'ab wapas nahi ja sakti', 'ab wapas nahi ja sakta',
    'decisión final', 'décision finale', 'endgültige entscheidung',
  ]
};

class EnhancedSuicideDetector {
  constructor() {}

  private calculatePatternScore(text: string): { score: number; matchedPatterns: string[] } {
    const lowerText = text.toLowerCase();
    let score = 0;
    const matchedPatterns: string[] = [];

    for (const pattern of ENHANCED_SUICIDE_PATTERNS.direct) {
      if (lowerText.includes(pattern)) {
        score += 10;
        matchedPatterns.push(`Direct threat: "${pattern}"`);
      }
    }

    for (const pattern of ENHANCED_SUICIDE_PATTERNS.indirect) {
      if (lowerText.includes(pattern)) {
        score += 6;
        matchedPatterns.push(`Indirect indicator: "${pattern}"`);
      }
    }

    for (const method of ENHANCED_SUICIDE_PATTERNS.methods) {
      if (lowerText.includes(method)) {
        score += 8;
        matchedPatterns.push(`Method reference: "${method}"`);
      }
    }

    for (const temporal of ENHANCED_SUICIDE_PATTERNS.temporal) {
      if (lowerText.includes(temporal)) {
        score += 7;
        matchedPatterns.push(`Temporal indicator: "${temporal}"`);
      }
    }

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

    Object.entries(CONTEXTUAL_RISK_INDICATORS).forEach(([category, indicators]) => {
      indicators.forEach(indicator => {
        if (lowerText.includes(indicator)) {
          const weight = category === 'plan_formation' || category === 'means_access' ? 5 : 3;
          score += weight;
          contextualCues.push(`${category}: "${indicator}"`);
        }
      });
    });

    if (context) {
      const recentMessages = context.messages.slice(-5);
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
        headers: { 'Content-Type': 'application/json' },
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

    // 🔑 SELF-REFERENTIAL CHECK FIRST
    // If user is talking about someone else, skip crisis detection entirely
    if (!isAboutSelf(text)) {
      return {
        riskLevel: 'low',
        confidence: 0,
        riskFactors: [],
        contextualCues: ['Message is about a third party, not the user themselves'],
        mcpClassification: false,
        recommendedAction: 'No action required — message is about someone else.',
        flagged: false,
        reason: 'Third-party reference detected — not self-harm or self-risk'
      };
    }

    const basicCheck = checkContent(text);
    const patternAnalysis = this.calculatePatternScore(text);
    const contextualAnalysis = this.analyzeContextualRisk(text, context);
    const mcpClassification = await this.callMCPClassifier(text);

    const totalScore = patternAnalysis.score + contextualAnalysis.score;
    const riskLevel = this.determineRiskLevel(totalScore, mcpClassification);

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
      reason: basicCheck.reason || 'Enhanced suicide/self-harm risk patterns detected'
    };

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

    try {
      console.error('HIGH RISK SUICIDE/SELF-HARM CASE DETECTED:', logEntry);
    } catch (_error) {
      console.error('Failed to log high-risk case:', _error);
    }
  }
}

export const suicideDetector = new EnhancedSuicideDetector();

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
  CONTEXTUAL_RISK_INDICATORS,
  isAboutSelf,
};