// import { checkContent } from './contentMonitor';

// // Enhanced RAG-based suicide detection with improved context awareness
// export interface SuicideRiskAnalysis {
//   riskLevel: 'low' | 'medium' | 'high' | 'critical';
//   confidence: number;
//   riskFactors: string[];
//   contextualCues: string[];
//   mcpClassification?: boolean;
//   recommendedAction: string;
//   flagged: boolean;
//   reason?: string;
// }

// interface ConversationContext {
//   messages: Array<{
//     role: 'user' | 'assistant' | 'system';
//     content: string;
//     timestamp: number;
//   }>;
//   userId: string;
//   conversationId: string;
// }

// // ============================================================
// // SELF-REFERENTIAL INDICATORS
// // Only trigger crisis response when user is talking about THEMSELVES
// // NOT when talking about someone else ("mera dost", "my friend", etc.)
// // ============================================================
// const SELF_REFERENTIAL_INDICATORS = [
//   // ===== ENGLISH =====
//   'i want', 'i am', 'i\'m', 'i will', 'i have', 'i feel', 'i need',
//   'i plan', 'i decided', 'i\'ve', 'i do', 'i can\'t', 'i cannot',
//   'myself', 'my life', 'my pain', 'my death', 'me ',
//   'i just', 'i keep', 'i keep', 'i know', 'i think about',

//   // ===== URDU / HINDI =====
//   'main ', 'mn ', 'mujhe', 'meri ', 'mere ', 'mera ',
//   'apne aap ko', 'khud ko', 'apni zindagi', 'meri zindagi',
//   'main chahti', 'main chahta', 'mn chahti', 'mn chahta',
//   'mujhe marna', 'mujhe jeena', 'meri taraf', 'apna',

//   // ===== SPANISH =====
//   'yo quiero', 'yo voy', 'yo he', 'yo soy', 'me quiero',
//   'mi vida', 'mi dolor', 'yo me', 'a mí mismo', 'a mí misma',

//   // ===== FRENCH =====
//   'je veux', 'je vais', 'j\'ai', 'je suis', 'je me',
//   'ma vie', 'ma douleur', 'moi-même',

//   // ===== ARABIC =====
//   'أنا', 'أريد', 'سأ', 'لدي', 'أشعر', 'حياتي', 'نفسي',

//   // ===== PORTUGUESE =====
//   'eu quero', 'eu vou', 'eu tenho', 'eu sou', 'me ',
//   'minha vida', 'minha dor', 'eu mesmo', 'eu mesma',

//   // ===== GERMAN =====
//   'ich will', 'ich werde', 'ich habe', 'ich bin', 'ich fühle',
//   'mein leben', 'mein schmerz', 'mich selbst',

//   // ===== ITALIAN =====
//   'voglio', 'andrò', 'ho ', 'sono ', 'mi ',
//   'la mia vita', 'il mio dolore', 'me stesso', 'me stessa',

//   // ===== TURKISH =====
//   'ben ', 'kendim', 'benim hayatım', 'istiyorum', 'yapacağım',

//   // ===== RUSSIAN =====
//   'я ', 'себя', 'моя жизнь', 'мне ', 'мой ',

//   // ===== BENGALI =====
//   'ami ', 'amar ', 'nijer', 'amake', 'amii',

//   // ===== PUNJABI =====
//   'main ', 'mera ', 'meri ', 'apne aap nu', 'apna ',
// ];

// // Third-person indicators — if these appear, it's about someone ELSE
// // Do NOT trigger crisis response
// const THIRD_PERSON_INDICATORS = [
//   // ===== ENGLISH =====
//   'my friend', 'my brother', 'my sister', 'my mother', 'my father',
//   'my mom', 'my dad', 'my son', 'my daughter', 'my cousin',
//   'my colleague', 'my classmate', 'my teacher', 'my husband', 'my wife',
//   'someone i know', 'a person i know', 'someone else',
//   'he wants', 'she wants', 'they want', 'he is going to', 'she is going to',
//   'he said', 'she said', 'they said', 'he told me', 'she told me',
//   'my neighbor', 'my relative', 'my uncle', 'my aunt',
//   'a friend of mine', 'one of my friends',

//   // ===== URDU / HINDI =====
//   'mera dost', 'meri saheli', 'mera bhai', 'meri behan',
//   'meri ammi', 'mere abbu', 'meri ami', 'mere walid',
//   'mera beta', 'meri beti', 'mera cousine', 'meri cousine',
//   'koi aur', 'ek aur', 'doosra', 'doosri',
//   'woh chahta', 'woh chahti', 'usne kaha', 'usne btaya',
//   'mere dost ne', 'meri friend ne', 'meri teacher ne',
//   'mere bhai ne', 'meri behan ne',
//   'kisi ne mujhe btaya', 'kisi ne kaha',
//   'mera shohar', 'meri biwi', 'mera rishtedaar',

//   // ===== SPANISH =====
//   'mi amigo', 'mi amiga', 'mi hermano', 'mi hermana',
//   'mi madre', 'mi padre', 'mi hijo', 'mi hija',
//   'alguien que conozco', 'otra persona', 'él quiere', 'ella quiere',
//   'mi esposo', 'mi esposa', 'mi vecino', 'mi vecina',

//   // ===== FRENCH =====
//   'mon ami', 'mon amie', 'mon frère', 'ma sœur',
//   'ma mère', 'mon père', 'mon fils', 'ma fille',
//   'quelqu\'un que je connais', 'quelqu\'un d\'autre',
//   'il veut', 'elle veut', 'mon mari', 'ma femme',

//   // ===== ARABIC =====
//   'صديقي', 'أخي', 'أختي', 'أمي', 'أبي',
//   'ابني', 'ابنتي', 'شخص آخر', 'هو يريد', 'هي تريد',
//   'زوجي', 'زوجتي', 'جاري',

//   // ===== PORTUGUESE =====
//   'meu amigo', 'minha amiga', 'meu irmão', 'minha irmã',
//   'minha mãe', 'meu pai', 'meu filho', 'minha filha',
//   'alguém que conheço', 'outra pessoa', 'ele quer', 'ela quer',

//   // ===== GERMAN =====
//   'mein freund', 'meine freundin', 'mein bruder', 'meine schwester',
//   'meine mutter', 'mein vater', 'jemand anderes', 'er will', 'sie will',

//   // ===== ITALIAN =====
//   'il mio amico', 'la mia amica', 'mio fratello', 'mia sorella',
//   'mia madre', 'mio padre', 'qualcun altro', 'lui vuole', 'lei vuole',

//   // ===== TURKISH =====
//   'arkadaşım', 'kardeşim', 'annem', 'babam',
//   'oğlum', 'kızım', 'başka biri', 'o istiyor',

//   // ===== BENGALI =====
//   'amar bondo', 'amar bhai', 'amar bon', 'amar ma', 'amar baba',
//   'amar chele', 'amar meye', 'onyo keu', 'se chai',

//   // ===== PUNJABI =====
//   'mera yaar', 'meri saheli', 'mera veer', 'meri pen',
//   'meri maa', 'mera pita', 'koi hor',
// ];

// /**
//  * KEY FUNCTION: Checks if the message is about the USER THEMSELVES
//  * Returns true = about self (trigger crisis check)
//  * Returns false = about someone else (skip crisis check)
//  */
// const isAboutSelf = (text: string): boolean => {
//   const lowerText = text.toLowerCase();

//   // If message contains third-person indicators → it's about someone else
//   for (const indicator of THIRD_PERSON_INDICATORS) {
//     if (lowerText.includes(indicator.toLowerCase())) {
//       return false;
//     }
//   }

//   // If message contains self-referential indicators → it's about self
//   for (const indicator of SELF_REFERENTIAL_INDICATORS) {
//     if (lowerText.includes(indicator.toLowerCase())) {
//       return true;
//     }
//   }

//   // Default: if unclear, treat as self-referential to be safe
//   return true;
// };

// // Enhanced suicide & self-harm patterns (Multiple Languages)
// const ENHANCED_SUICIDE_PATTERNS = {
//   direct: [
//     // ===== ENGLISH — Suicide =====
//     'i want to kill myself',
//     'i am going to kill myself',
//     'i plan to end my life',
//     'i am going to commit suicide',
//     'i have decided to die',
//     'i will take my own life',
//     'tonight is my last night',
//     'i have a plan to',
//     'i already have the means',
//     'i know how i will do it',
//     'i want to end it all',
//     'i want to disappear forever',
//     'i dont want to be alive anymore',
//     'i don\'t want to be alive anymore',
//     'i wish i was dead',
//     'i wish i were dead',
//     'i want to be dead',
//     'i am better off dead',
//     'everyone would be better without me',
//     'no reason to live',
//     'nothing to live for',
//     'i want to stop existing',
//     'life is not worth living',
//     'i cant take it anymore',
//     'i can\'t take it anymore',
//     'this is my last message',
//     'goodbye forever',
//     'i have made up my mind to die',
//     'i will end my suffering',
//     'i want to jump',
//     'i want to overdose',
//     'i have pills ready',
//     'i have a gun',
//     'i have a knife ready',

//     // ===== ENGLISH — Self-Harm =====
//     'i want to hurt myself',
//     'i want to harm myself',
//     'i want to cut myself',
//     'i am cutting myself',
//     'i cut myself',
//     'i hurt myself',
//     'i burn myself',
//     'i want to burn myself',
//     'i hit myself',
//     'i want to hit myself',
//     'i want to injure myself',
//     'i am self harming',
//     'i self harm',
//     'i want to self harm',
//     'i want to scratch myself',
//     'i want to starve myself',
//     'i am starving myself',
//     'i want to punish myself',
//     'i deserve pain',
//     'i deserve to be hurt',
//     'i want to feel pain',
//     'i need to feel pain',

//     // ===== URDU — Suicide =====
//     'khudkushi karna chahti hoon',
//     'khudkushi karna chahta hoon',
//     'jaan lena chahti hoon',
//     'jaan lena chahta hoon',
//     'jaan lena chahti hon',
//     'jaan lena chahta hon',
//     'marna chahti hoon',
//     'marna chahta hoon',
//     'marna chahti hon',
//     'marna chahta hon',
//     'mn marna chahti hon',
//     'mn marna chahta hon',
//     'khudkushi karne wali hoon',
//     'khudkushi karne wala hoon',
//     'khudkushi krne wali hoon',
//     'khudkushi krne wala hoon',
//     'khudkushi krni hoon',
//     'khudkushi krna hoon',
//     'khudkushi krni hon',
//     'khudkushi krna hon',
//     'zindagi khatam karna chahti hoon',
//     'zindagi khatam karna chahta hoon',
//     'zindagi khatam krna chahti hoon',
//     'zindagi khatam krna chahta hoon',
//     'khud ko maarna chahti hoon',
//     'khud ko maarna chahta hoon',
//     'khud ko marna chahti hoon',
//     'khud ko marna chahta hoon',
//     'aaj raat meri aakhri raat hai',
//     'kal mera aakhri din hai',
//     'main marne ka faisla kar chuki hoon',
//     'main marne ka faisla kar chuka hoon',
//     'mn marne ka faisla kar chuki hoon',
//     'mn marne ka faisla kar chuka hoon',
//     'main khudkushi karne wali hoon',
//     'main khudkushi karne wala hoon',
//     'mn khudkushi karne wali hoon',
//     'mn khudkushi karne wala hoon',
//     'mn khudkushi krne wali hoon',
//     'mn khudkushi krne wala hoon',
//     'mn khudkushi krna chahti hon',
//     'mn khudkushi krna chahta hon',
//     'jeena nahi chahti',
//     'jeena nahi chahta',
//     'mujhe marna hai',
//     'main mar jaana chahti hoon',
//     'main mar jaana chahta hoon',
//     'zindagi se tang aa gayi hoon',
//     'zindagi se tang aa gaya hoon',

//     // ===== URDU — Self-Harm =====
//     'khud ko takleef dena chahti hoon',
//     'khud ko takleef dena chahta hoon',
//     'khud ko zakhmi karna chahti hoon',
//     'khud ko zakhmi karna chahta hoon',
//     'apne aap ko maarna chahti hoon',
//     'apne aap ko maarna chahta hoon',
//     'khud ko kata chahti hoon',
//     'khud ko kata chahta hoon',
//     'khud ko jalana chahti hoon',
//     'khud ko jalana chahta hoon',
//     'apne aap ko hurt karna chahti hoon',
//     'apne aap ko hurt karna chahta hoon',
//     'dard chahiye mujhe',
//     'mujhe saza milni chahiye',
//     'main apne aap ko saza dena chahti hoon',
//     'main apne aap ko saza dena chahta hoon',

//     // ===== SPANISH — Suicide =====
//     'quiero matarme',
//     'voy a suicidarme',
//     'planeo terminar mi vida',
//     'he decidido morir',
//     'quiero acabar con esto',
//     'no aguanto más la vida',
//     'quiero dejar de existir',
//     'no quiero seguir viviendo',
//     'ya no quiero vivir',

//     // ===== SPANISH — Self-Harm =====
//     'quiero hacerme daño',
//     'me quiero cortar',
//     'me estoy cortando',
//     'quiero lastimarme',
//     'quiero sentir dolor',
//     'merezco dolor',
//     'me quiero quemar',

//     // ===== FRENCH — Suicide =====
//     'je veux me tuer',
//     'je vais me suicider',
//     'je décide de mourir',
//     'je veux mettre fin à ma vie',
//     'j\'en ai assez de vivre',
//     'je ne veux plus vivre',
//     'je vais en finir',

//     // ===== FRENCH — Self-Harm =====
//     'je veux me blesser',
//     'je me coupe',
//     'je veux me couper',
//     'je me fais du mal',
//     'je veux me faire du mal',
//     'je mérite d\'avoir mal',
//     'j\'ai besoin de souffrir',
//     'je veux me brûler',

//     // ===== ARABIC — Suicide =====
//     'أريد أن أنهي حياتي',
//     'سأنتحر',
//     'لا أستطيع العيش',
//     'سأضع حداً لحياتي',
//     'أريد أن أموت',
//     'لا أريد أن أكمل حياتي',

//     // ===== ARABIC — Self-Harm =====
//     'أريد إيذاء نفسي',
//     'أريد جرح نفسي',
//     'أجرح نفسي',
//     'أريد أن أتألم',
//     'أستحق الألم',
//     'أريد أن أحرق نفسي',

//     // ===== PORTUGUESE — Suicide =====
//     'quero me matar',
//     'vou me suicidar',
//     'quero acabar com minha vida',
//     'não aguento mais viver',
//     'não quero mais viver',

//     // ===== PORTUGUESE — Self-Harm =====
//     'quero me machucar',
//     'quero me cortar',
//     'me corto',
//     'mereço dor',
//     'preciso sentir dor',
//     'quero me queimar',

//     // ===== GERMAN — Suicide =====
//     'ich will mich töten',
//     'ich werde mich umbringen',
//     'ich will mein Leben beenden',
//     'ich kann nicht mehr leben',
//     'ich will nicht mehr leben',

//     // ===== GERMAN — Self-Harm =====
//     'ich will mir wehtun',
//     'ich verletze mich selbst',
//     'ich will mich schneiden',
//     'ich schneide mich',
//     'ich verdiene schmerzen',
//     'ich brauche schmerzen',
//     'ich will mich verbrennen',

//     // ===== ITALIAN — Suicide =====
//     'voglio suicidarmi',
//     'vado a togliermi la vita',
//     'non posso più vivere',
//     'voglio morire',
//     'non voglio più vivere',

//     // ===== ITALIAN — Self-Harm =====
//     'voglio farmi del male',
//     'mi faccio del male',
//     'voglio tagliarmi',
//     'mi taglio',
//     'merito di soffrire',
//     'voglio bruciarmi',

//     // ===== HINDI — Suicide =====
//     'main apne aap ko maarna chahta hoon',
//     'main aatmahatya karna chahta hoon',
//     'mujhe jeena nahi hai',
//     'zindagi se thak gaya hoon',
//     'main mar jaana chahta hoon',
//     'mujhe marna hai',

//     // ===== HINDI — Self-Harm =====
//     'main apne aap ko takleef dena chahta hoon',
//     'main khud ko zakhmi karna chahta hoon',
//     'mujhe dard chahiye',
//     'main saza chahta hoon apne aap ko',
//     'main khud ko jalana chahta hoon',

//     // ===== BENGALI — Suicide =====
//     'ami nij-deh poriksha korte chai',
//     'ami jeeban sesh korte chai',
//     'jeeban aro chalte parchhi na',
//     'ami morte chai',
//     'ami amar jibon sesh korte chai',

//     // ===== BENGALI — Self-Harm =====
//     'ami nijer khoti korte chai',
//     'ami nijeke kaatle chai',
//     'ami kosto pete chai',
//     'ami shasti paowar joggo',
//     'ami nijeke pora chai',

//     // ===== TURKISH — Suicide =====
//     'kendimi öldürmek istiyorum',
//     'intihar edeceğim',
//     'hayatımı bitirmek istiyorum',
//     'artık dayanamıyorum',
//     'yaşamak istemiyorum',

//     // ===== TURKISH — Self-Harm =====
//     'kendime zarar vermek istiyorum',
//     'kendimi kesmek istiyorum',
//     'kendimi kesiyorum',
//     'acı hissetmek istiyorum',
//     'acıyı hak ediyorum',
//     'kendimi yakmak istiyorum',
//     'kendimi cezalandırmak istiyorum',

//     // ===== RUSSIAN — Suicide =====
//     'я хочу убить себя',
//     'я собираюсь покончить с собой',
//     'я хочу умереть',
//     'я не хочу больше жить',

//     // ===== RUSSIAN — Self-Harm =====
//     'я хочу причинить себе вред',
//     'я режу себя',
//     'я хочу порезать себя',
//     'я заслуживаю боли',
//     'я наказываю себя',

//     // ===== JAPANESE — Suicide =====
//     '死にたい',
//     '自殺したい',
//     '消えてしまいたい',
//     '生きていたくない',

//     // ===== JAPANESE — Self-Harm =====
//     '自分を傷つけたい',
//     '自分を切りたい',
//     '自傷している',
//     '痛みを感じたい',
//     '自分を罰したい',

//     // ===== CHINESE — Suicide =====
//     '我想死',
//     '我要自杀',
//     '我想结束生命',
//     '我不想活了',

//     // ===== CHINESE — Self-Harm =====
//     '我想伤害自己',
//     '我想割自己',
//     '我在割自己',
//     '我应该受苦',
//     '我想惩罚自己',

//     // ===== KOREAN — Suicide =====
//     '죽고 싶다',
//     '자살하고 싶다',
//     '사라지고 싶다',
//     '더 이상 살고 싶지 않다',

//     // ===== KOREAN — Self-Harm =====
//     '나 자신을 다치게 하고 싶다',
//     '나를 자르고 싶다',
//     '고통을 느끼고 싶다',
//     '나는 벌을 받아야 해',

//     // ===== PUNJABI — Suicide =====
//     'main apne aap nu maarna chahunda haan',
//     'main khatam ho jaana chahunda haan',
//     'mujhe jeona nahi',
//     'main mar jaana chahunda haan',

//     // ===== PUNJABI — Self-Harm =====
//     'main apne aap nu takleef dena chahunda haan',
//     'main khud nu zakhmi karna chahunda haan',
//     'mujhe dard chahida hai',
//     'main saza chahunda haan apne aap nu',
//   ],
//   indirect: [
//     // ===== ENGLISH =====
//     'i can\'t go on anymore',
//     'there\'s no point in living',
//     'everyone would be better without me',
//     'i feel like giving up',
//     'life is too hard',
//     'i don\'t see a way out',
//     'i feel trapped',
//     'nothing will ever get better',
//     'i am a burden to everyone',
//     'i just want the pain to stop',

//     // ===== URDU =====
//     'zindagi se tang aa gayi hoon',
//     'zindagi se tang aa gaya hoon',
//     'zindagi ka koi matlab nahi',
//     'sab log bina mere behtar honge',
//     'main haar maan gayi hoon',
//     'main haar maan gaya hoon',
//     'zindagi bahut mushkil hai',
//     'koi raasta nahi dikhta',
//     'main phas gayi hoon',
//     'main phas gaya hoon',
//     'kabhi kuch behtar nahi hoga',
//     'main sab ki bojh hoon',
//     'dard khatam karna chahti hoon',
//     'dard khatam karna chahta hoon',

//     // ===== SPANISH =====
//     'no puedo seguir',
//     'no hay razón para vivir',
//     'todos estarían mejor sin mí',
//     'quiero rendirme',
//     'me siento atrapado',
//     'nunca mejorará',
//     'soy una carga para todos',

//     // ===== FRENCH =====
//     'je ne peux pas continuer',
//     'il n\'y a pas de raison de vivre',
//     'tout le monde serait mieux sans moi',
//     'je veux abandonner',
//     'je me sens piégé',
//     'rien n\'ira jamais mieux',
//     'je suis un fardeau pour tout le monde',

//     // ===== ARABIC =====
//     'لا يمكنني المتابعة',
//     'لا فائدة من العيش',
//     'الجميع سيكونون أفضل بدوني',
//     'أنا محاصر',
//     'أنا عبء على الجميع',

//     // ===== GERMAN =====
//     'ich kann nicht mehr',
//     'alle wären besser ohne mich',
//     'ich fühle mich gefangen',
//     'es wird nie besser',
//     'ich bin eine Last für alle',

//     // ===== HINDI =====
//     'main aur jee nahi sakta',
//     'jeene ka koi matlab nahi',
//     'main haar maan gaya hoon',
//     'main fasa hoon',
//     'main sab ke liye bojh hoon',

//     // ===== TURKISH =====
//     'devam edemiyorum',
//     'herkes bensiz daha iyi olurdu',
//     'çıkış yolu göremiyorum',
//     'herkese yük oluyorum',
//   ],
//   methods: [
//     // ===== ENGLISH =====
//     'pills', 'rope', 'bridge', 'gun', 'knife', 'overdose',
//     'hanging', 'jumping', 'drowning', 'cutting', 'poison',

//     // ===== URDU =====
//     'goli', 'rassee', 'pul', 'bandook', 'chaku', 'dawai',
//     'latakna', 'koodna', 'dubna', 'kaatna', 'zehar',

//     // ===== SPANISH =====
//     'pastillas', 'cuerda', 'puente', 'arma', 'cuchillo', 'sobredosis',
//     'ahorcamiento', 'saltar', 'veneno',

//     // ===== FRENCH =====
//     'pilules', 'corde', 'pont', 'couteau', 'overdose',
//     'pendaison', 'sauter', 'poison',

//     // ===== ARABIC =====
//     'حبوب', 'حبل', 'جسر', 'سكين', 'جرعة زائدة', 'سم',

//     // ===== GERMAN =====
//     'pillen', 'seil', 'brücke', 'messer', 'überdosis', 'gift',

//     // ===== HINDI =====
//     'rassi', 'pul', 'chhuri', 'jahar', 'latakna', 'koodna', 'doobna',

//     // ===== TURKISH =====
//     'hap', 'ip', 'köprü', 'bıçak', 'zehir',
//   ],
//   temporal: [
//     // ===== ENGLISH =====
//     'tonight', 'very soon', 'this is my last',
//     'final goodbye', 'last time', 'end is near',

//     // ===== URDU =====
//     'aaj raat', 'bahut jaldi', 'aakhri baar', 'yeh meri aakhri',
//     'ant kareeb hai', 'aakhri alvida',

//     // ===== SPANISH =====
//     'esta noche', 'muy pronto', 'última vez', 'el fin está cerca',

//     // ===== FRENCH =====
//     'ce soir', 'très bientôt', 'dernière fois', 'la fin est proche',

//     // ===== ARABIC =====
//     'الليلة', 'قريباً جداً', 'آخر مرة', 'النهاية قريبة',

//     // ===== GERMAN =====
//     'heute nacht', 'sehr bald', 'das letzte mal', 'das ende ist nah',

//     // ===== HINDI =====
//     'aaj raat', 'bahut jaldi', 'aakhri baar', 'ant kareeb hai',

//     // ===== TURKISH =====
//     'bu gece', 'çok yakında', 'son kez', 'son yakın',
//   ],
//   emotional_distress: [
//     // ===== ENGLISH =====
//     'hopeless', 'worthless', 'empty', 'numb', 'broken',
//     'alone', 'abandoned', 'rejected', 'failure', 'useless',

//     // ===== URDU =====
//     'be umeed', 'bekar', 'khali', 'sunn', 'tota hua',
//     'akeli', 'akela', 'chhoda gaya', 'naakam', 'laachaar',
//     'dukhi', 'pareshan', 'ghamgin', 'udass',

//     // ===== SPANISH =====
//     'desesperado', 'inútil', 'vacío', 'roto',
//     'solo', 'abandonado', 'fracaso',

//     // ===== ARABIC =====
//     'يائس', 'عديم القيمة', 'فارغ', 'مكسور',
//     'وحيد', 'مهجور', 'مرفوض', 'فشل',

//     // ===== GERMAN =====
//     'hoffnungslos', 'wertlos', 'leer', 'zerbrochen',
//     'allein', 'verlassen', 'versagen',

//     // ===== HINDI =====
//     'nihasa', 'behkaar', 'khali', 'akela', 'naakam',
//     'udas', 'pareshaan', 'dukhi',

//     // ===== TURKISH =====
//     'umutsuz', 'değersiz', 'boş', 'kırılmış',
//     'yalnız', 'terk edilmiş', 'başarısız',
//   ]
// };

// const CONTEXTUAL_RISK_INDICATORS = {
//   isolation: [
//     'no one cares', 'all alone', 'nobody understands', 'no friends',
//     'koi care nahi karta', 'bilkul akeli', 'bilkul akela', 'koi samajhta nahi',
//     'koi dost nahi', 'nadie se preocupa', 'personne ne s\'en soucie',
//     'niemand kümmert sich', 'kimse umursamıyor',
//   ],
//   plan_formation: [
//     'i have thought about', 'i have been planning', 'i know exactly how',
//     'i\'ve made plans', 'everything is ready', 'i\'ve decided',
//     'main soch chuki hoon', 'main plan bana rahi hoon', 'maine faisla kiya hai',
//     'he pensado en ello', 'j\'ai décidé', 'ich habe entschieden',
//   ],
//   means_access: [
//     'i have access to', 'i can get', 'i already have',
//     'i possess', 'readily available',
//     'mere paas hai', 'main la sakti hoon', 'main la sakta hoon',
//     'tengo acceso a', 'j\'ai accès à', 'ich habe zugang zu',
//   ],
//   timeline: [
//     'very soon', 'tonight', 'today', 'this week', 'final', 'last',
//     'aaj raat', 'aaj', 'is hafte', 'aakhri',
//     'esta noche', 'hoy', 'ce soir', 'heute nacht',
//   ],
//   finality: [
//     'final decision', 'made up my mind', 'there\'s no going back', 'i\'m done',
//     'no more chances', 'point of no return',
//     'aakhri faisla', 'ab wapas nahi ja sakti', 'ab wapas nahi ja sakta',
//     'decisión final', 'décision finale', 'endgültige entscheidung',
//   ]
// };

// class EnhancedSuicideDetector {
//   constructor() {}

//   private calculatePatternScore(text: string): { score: number; matchedPatterns: string[] } {
//     const lowerText = text.toLowerCase();
//     let score = 0;
//     const matchedPatterns: string[] = [];

//     for (const pattern of ENHANCED_SUICIDE_PATTERNS.direct) {
//       if (lowerText.includes(pattern)) {
//         score += 10;
//         matchedPatterns.push(`Direct threat: "${pattern}"`);
//       }
//     }

//     for (const pattern of ENHANCED_SUICIDE_PATTERNS.indirect) {
//       if (lowerText.includes(pattern)) {
//         score += 6;
//         matchedPatterns.push(`Indirect indicator: "${pattern}"`);
//       }
//     }

//     for (const method of ENHANCED_SUICIDE_PATTERNS.methods) {
//       if (lowerText.includes(method)) {
//         score += 8;
//         matchedPatterns.push(`Method reference: "${method}"`);
//       }
//     }

//     for (const temporal of ENHANCED_SUICIDE_PATTERNS.temporal) {
//       if (lowerText.includes(temporal)) {
//         score += 7;
//         matchedPatterns.push(`Temporal indicator: "${temporal}"`);
//       }
//     }

//     for (const emotion of ENHANCED_SUICIDE_PATTERNS.emotional_distress) {
//       if (lowerText.includes(emotion)) {
//         score += 3;
//         matchedPatterns.push(`Emotional distress: "${emotion}"`);
//       }
//     }

//     return { score, matchedPatterns };
//   }

//   private analyzeContextualRisk(text: string, context?: ConversationContext): { score: number; contextualCues: string[] } {
//     const lowerText = text.toLowerCase();
//     let score = 0;
//     const contextualCues: string[] = [];

//     Object.entries(CONTEXTUAL_RISK_INDICATORS).forEach(([category, indicators]) => {
//       indicators.forEach(indicator => {
//         if (lowerText.includes(indicator)) {
//           const weight = category === 'plan_formation' || category === 'means_access' ? 5 : 3;
//           score += weight;
//           contextualCues.push(`${category}: "${indicator}"`);
//         }
//       });
//     });

//     if (context) {
//       const recentMessages = context.messages.slice(-5);
//       const negativePatterns = recentMessages.filter(msg =>
//         msg.role === 'user' && this.calculatePatternScore(msg.content).score > 0
//       );

//       if (negativePatterns.length >= 2) {
//         score += 4;
//         contextualCues.push('Escalating pattern detected in conversation history');
//       }
//     }

//     return { score, contextualCues };
//   }

//   private async callMCPClassifier(text: string): Promise<boolean> {
//     try {
//       const response = await fetch('http://localhost:8002/analyze_suicide_risk', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           text,
//           conversation_id: 'current',
//           user_id: 'current-user',
//           context_messages: []
//         }),
//       });

//       if (response.ok) {
//         const result = await response.json();
//         return result.mcp_classification || false;
//       }
//     } catch {
//       console.warn('Enhanced RAG API unavailable, using fallback detection');
//     }
//     return false;
//   }

//   private determineRiskLevel(score: number, mcpPositive: boolean): 'low' | 'medium' | 'high' | 'critical' {
//     if (score >= 15 || mcpPositive) return 'critical';
//     if (score >= 10) return 'high';
//     if (score >= 5) return 'medium';
//     return 'low';
//   }

//   private getRecommendedAction(riskLevel: string): string {
//     switch (riskLevel) {
//       case 'critical':
//         return 'IMMEDIATE INTERVENTION REQUIRED: Contact emergency services (911) or crisis hotline (988). Do not leave person alone.';
//       case 'high':
//         return 'URGENT: Contact mental health professional immediately. Consider safety planning and crisis resources.';
//       case 'medium':
//         return 'MONITOR CLOSELY: Schedule mental health assessment. Provide crisis resources and support.';
//       case 'low':
//         return 'PREVENTIVE: Continue supportive conversation. Monitor for changes in mood or expression.';
//       default:
//         return 'Continue monitoring and provide supportive resources.';
//     }
//   }

//   public async analyzeSuicideRisk(
//     text: string,
//     context?: ConversationContext
//   ): Promise<SuicideRiskAnalysis> {

//     // 🔑 SELF-REFERENTIAL CHECK FIRST
//     // If user is talking about someone else, skip crisis detection entirely
//     if (!isAboutSelf(text)) {
//       return {
//         riskLevel: 'low',
//         confidence: 0,
//         riskFactors: [],
//         contextualCues: ['Message is about a third party, not the user themselves'],
//         mcpClassification: false,
//         recommendedAction: 'No action required — message is about someone else.',
//         flagged: false,
//         reason: 'Third-party reference detected — not self-harm or self-risk'
//       };
//     }

//     const basicCheck = checkContent(text);
//     const patternAnalysis = this.calculatePatternScore(text);
//     const contextualAnalysis = this.analyzeContextualRisk(text, context);
//     const mcpClassification = await this.callMCPClassifier(text);

//     const totalScore = patternAnalysis.score + contextualAnalysis.score;
//     const riskLevel = this.determineRiskLevel(totalScore, mcpClassification);

//     const confidence = Math.min(
//       (totalScore / 20) * 0.7 +
//       (mcpClassification ? 0.3 : 0) +
//       (basicCheck.flagged ? 0.2 : 0),
//       1.0
//     );

//     const analysis: SuicideRiskAnalysis = {
//       riskLevel,
//       confidence,
//       riskFactors: patternAnalysis.matchedPatterns,
//       contextualCues: contextualAnalysis.contextualCues,
//       mcpClassification,
//       recommendedAction: this.getRecommendedAction(riskLevel),
//       flagged: riskLevel !== 'low' || basicCheck.flagged,
//       reason: basicCheck.reason || 'Enhanced suicide/self-harm risk patterns detected'
//     };

//     if (riskLevel === 'high' || riskLevel === 'critical') {
//       this.logHighRiskCase(text, analysis, context);
//     }

//     return analysis;
//   }

//   private async logHighRiskCase(
//     text: string,
//     analysis: SuicideRiskAnalysis,
//     context?: ConversationContext
//   ) {
//     const logEntry = {
//       timestamp: new Date().toISOString(),
//       userId: context?.userId || 'unknown',
//       conversationId: context?.conversationId || 'unknown',
//       messageContent: text,
//       riskAnalysis: analysis,
//       requiresImmediateAttention: analysis.riskLevel === 'critical'
//     };

//     try {
//       console.error('HIGH RISK SUICIDE/SELF-HARM CASE DETECTED:', logEntry);
//     } catch (_error) {
//       console.error('Failed to log high-risk case:', _error);
//     }
//   }
// }

// export const suicideDetector = new EnhancedSuicideDetector();

// export const enhancedCheckContent = async (
//   text: string,
//   context?: ConversationContext
// ): Promise<SuicideRiskAnalysis> => {
//   return await suicideDetector.analyzeSuicideRisk(text, context);
// };

// export default {
//   suicideDetector,
//   enhancedCheckContent,
//   ENHANCED_SUICIDE_PATTERNS,
//   CONTEXTUAL_RISK_INDICATORS,
//   isAboutSelf,
// };


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
// Detects questions / research / educational messages about
// suicide so they NEVER trigger a crisis response.
//
// Examples that return true (no crisis):
//   "is suicide good or bad?"
//   "why do people commit suicide?"
//   "kya khudkushi gunah hai?"
//   "what are the warning signs of suicide?"
//   "my essay is about suicide prevention"
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

  // ===== URDU / HINDI =====
  'kya khudkushi', 'khudkushi kyun', 'khudkushi kya hai',
  'khudkushi ke baare mein', 'khudkushi ki wajah', 'khudkushi ke karan',
  'suicide kya hota hai', 'aatmahatya kya', 'aatmahatya kyun',
  'kya ye sahi hai', 'sahi ya galat', 'theek hai ya nahi',
  'kisi ki madad kaise', 'kisi ko bachana', 'lakshan kya hain',
  'signs kya hain', 'suicide se rokna', 'khudkushi rokna',
  'khudkushi ke baare',  'kya main madad kar sakta',
  'kya main madad kar sakti', 'kisi aur ke liye',
  'suicide ki wajah kya', 'khudkushi ki wajah kya',
  'aatmahatya ke karan', 'khudkushi kaise rokein',
  'meri research', 'mera essay', 'mera assignment',
  'padhna chahta hoon', 'padhna chahti hoon',
  'jaanna chahta hoon', 'jaanna chahti hoon',
  'samajhna chahta', 'samajhna chahti',

  // ===== SPANISH =====
  'es el suicidio', 'por qué la gente', 'por qué alguien',
  'qué es el suicidio', 'qué causa el suicidio',
  'señales de suicidio', 'prevención del suicidio',
  'información sobre el suicidio', 'bueno o malo',
  'cómo ayudar a alguien', 'cómo puedo ayudar',
  'signos de suicidio', 'qué debo hacer si',
  'mi ensayo sobre', 'mi investigación sobre',
  'hablar sobre el suicidio', 'entender el suicidio',

  // ===== FRENCH =====
  'est-ce que le suicide', 'pourquoi les gens', 'pourquoi quelqu\'un',
  'qu\'est-ce que le suicide', 'ce qui cause le suicide',
  'signes de suicide', 'prévention du suicide', 'bon ou mauvais',
  'comment aider quelqu\'un', 'comment puis-je aider',
  'mon essai sur', 'ma recherche sur', 'parler du suicide',

  // ===== ARABIC =====
  'هل الانتحار', 'لماذا ينتحر', 'ما هو الانتحار',
  'علامات الانتحار', 'منع الانتحار', 'أسباب الانتحار',
  'كيف أساعد', 'كيف يمكنني مساعدة', 'بحثي عن',
  'مقالتي عن', 'جيد أم سيئ', 'صواب أم خطأ',

  // ===== GERMAN =====
  'ist suizid', 'warum begehen menschen', 'warum würde jemand',
  'was ist suizid', 'was verursacht suizid',
  'zeichen von suizid', 'suizidprävention', 'gut oder schlecht',
  'wie kann ich jemandem helfen', 'mein aufsatz über',
  'über suizid sprechen',

  // ===== PORTUGUESE =====
  'o suicídio é', 'por que as pessoas', 'por que alguém',
  'o que é suicídio', 'o que causa suicídio',
  'sinais de suicídio', 'prevenção do suicídio',
  'como ajudar alguém', 'bom ou ruim', 'meu ensaio sobre',

  // ===== ITALIAN =====
  'il suicidio è', 'perché le persone', 'perché qualcuno',
  'cos\'è il suicidio', 'prevenzione del suicidio',
  'segni di suicidio', 'come aiutare qualcuno', 'bene o male',

  // ===== TURKISH =====
  'intihar nedir', 'neden insanlar intihar', 'neden biri intihar',
  'intihar iyi mi', 'intihar önleme', 'intiharın belirtileri',
  'birine nasıl yardım', 'araştırmam', 'ödevim hakkında',

  // ===== RUSSIAN =====
  'что такое суицид', 'почему люди', 'почему кто-то',
  'признаки суицида', 'предотвращение суицида',
  'как помочь кому-то', 'хорошо или плохо',

  // ===== PUNJABI =====
  'kya khudkushi', 'khudkushi kyun hundi', 'khudkushi kya hundi',
  'khudkushi rokna', 'kisi di madad', 'sahi ya galat',
];

export const isInformationalQuery = (text: string): boolean => {
  const lower = text.toLowerCase().trim();

  // Check all informational indicator phrases
  for (const indicator of INFORMATIONAL_INDICATORS) {
    if (lower.includes(indicator)) return true;
  }

  // Short messages ending with "?" that don't contain self-harm verbs
  // are almost certainly questions, not crisis messages
  const SELF_HARM_VERBS = [
    'want to kill', 'going to kill', 'will kill', 'plan to kill',
    'want to die', 'going to die', 'want to end', 'want to hurt',
    'want to harm', 'want to cut', 'am cutting', 'have cut',
    'marna chahta', 'marna chahti', 'khudkushi karna',
    'quiero matarme', 'voy a suicidarme', 'je veux me tuer',
    'ich will mich', 'voglio suicidarmi', 'kendimi öldürmek',
    'я хочу убить', '死にたい', '我想死',
  ];

  const hasSelfHarmVerb = SELF_HARM_VERBS.some(v => lower.includes(v));

  if (!hasSelfHarmVerb && lower.endsWith('?') && lower.length < 120) {
    return true;
  }

  return false;
};

// ============================================================
// SELF-REFERENTIAL INDICATORS
// Only trigger crisis response when user is talking about THEMSELVES
// ============================================================
const SELF_REFERENTIAL_INDICATORS = [
  // ===== ENGLISH =====
  'i want', 'i am', 'i\'m', 'i will', 'i have', 'i feel', 'i need',
  'i plan', 'i decided', 'i\'ve', 'i do', 'i can\'t', 'i cannot',
  'myself', 'my life', 'my pain', 'my death', 'me ',
  'i just', 'i keep', 'i know', 'i think about',

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

// Third-person indicators — message is about someone ELSE, skip crisis
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

export const isAboutSelf = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  for (const indicator of THIRD_PERSON_INDICATORS) {
    if (lowerText.includes(indicator.toLowerCase())) return false;
  }
  for (const indicator of SELF_REFERENTIAL_INDICATORS) {
    if (lowerText.includes(indicator.toLowerCase())) return true;
  }
  return true;
};

// ============================================================
// SUICIDE & SELF-HARM PATTERNS
// direct   — full explicit phrases (score 10 each)
// indirect — full softer phrases (score 6 each)
// methods  — method words, only score when paired with intent verb (score 8)
// temporal — time urgency phrases (score 7 each)
// emotional_distress — single words, only score when base > 0 (score 3 each)
// ============================================================
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
    'i have a plan to end',
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
    'i want to jump off',
    'i want to overdose',
    'i have pills ready to take',
    'i have a gun ready',
    'i have a knife ready to use',

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
    'jeena nahi chahti hoon',
    'jeena nahi chahta hoon',
    'jeena nahi chahti',
    'jeena nahi chahta',
    'mujhe marna hai',
    'main mar jaana chahti hoon',
    'main mar jaana chahta hoon',
    'zindagi se tang aa gayi hoon',
    'zindagi se tang aa gaya hoon',
    'zindagi nahi chahiye mujhe',
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
    'dard chahiye mujhe',
    'mujhe saza milni chahiye',
    'main apne aap ko saza dena chahti hoon',
    'main apne aap ko saza dena chahta hoon',

    // ===== SPANISH — Suicide =====
    'quiero matarme',
    'voy a suicidarme',
    'planeo terminar mi vida',
    'he decidido morir',
    'quiero acabar con mi vida',
    'quiero acabar con todo',
    'no aguanto más la vida',
    'quiero dejar de existir',
    'no quiero seguir viviendo',
    'ya no quiero vivir',
    'quiero desaparecer para siempre',
    'todos estarían mejor sin mí',
    'no hay razón para vivir',
    'esta es mi última noche',
    'me voy a quitar la vida',
    'he tomado la decisión de morir',

    // ===== SPANISH — Self-Harm =====
    'quiero hacerme daño',
    'me quiero cortar',
    'me estoy cortando',
    'me hago daño a mí mismo',
    'quiero lastimarme',
    'me lastimo a propósito',
    'quiero sentir dolor',
    'merezco dolor',
    'me quiero quemar',
    'me castigo a mí mismo',

    // ===== FRENCH — Suicide =====
    'je veux me tuer',
    'je vais me suicider',
    'j\'ai décidé de mourir',
    'je veux mettre fin à ma vie',
    'j\'en ai assez de vivre',
    'je ne veux plus vivre',
    'je veux disparaître pour toujours',
    'tout le monde serait mieux sans moi',
    'je n\'ai aucune raison de vivre',
    'c\'est ma dernière nuit',
    'je vais en finir avec tout',
    'j\'ai pris la décision de mourir',

    // ===== FRENCH — Self-Harm =====
    'je veux me blesser',
    'je me coupe intentionnellement',
    'je veux me couper',
    'je me fais du mal volontairement',
    'je veux me faire du mal',
    'je mérite d\'avoir mal',
    'j\'ai besoin de souffrir',
    'je veux me brûler',
    'je me punis',

    // ===== ARABIC — Suicide =====
    'أريد أن أنهي حياتي',
    'سأنتحر',
    'لا أستطيع الاستمرار في العيش',
    'سأضع حداً لحياتي',
    'أريد أن أموت',
    'لا أريد أن أكمل حياتي',
    'الجميع أفضل بدوني',
    'لا سبب للعيش',
    'أريد الاختفاء إلى الأبد',
    'هذه آخر ليلة لي',
    'قررت أن أموت',

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
    'decidi morrer',

    // ===== PORTUGUESE — Self-Harm =====
    'quero me machucar',
    'quero me cortar',
    'estou me cortando',
    'me machucar de propósito',
    'mereço dor',
    'preciso sentir dor',
    'quero me queimar',
    'me punir',

    // ===== GERMAN — Suicide =====
    'ich will mich töten',
    'ich werde mich umbringen',
    'ich will mein leben beenden',
    'ich kann nicht mehr leben',
    'ich will nicht mehr leben',
    'ich will für immer verschwinden',
    'alle wären besser ohne mich',
    'es gibt keinen grund mehr zu leben',
    'das ist meine letzte nacht',
    'ich habe beschlossen zu sterben',

    // ===== GERMAN — Self-Harm =====
    'ich will mir wehtun',
    'ich verletze mich absichtlich',
    'ich will mich schneiden',
    'ich schneide mich absichtlich',
    'ich verdiene schmerzen',
    'ich brauche schmerzen',
    'ich will mich verbrennen',
    'ich bestrafe mich selbst',

    // ===== ITALIAN — Suicide =====
    'voglio suicidarmi',
    'mi toglierò la vita',
    'non posso più vivere',
    'voglio morire',
    'non voglio più vivere',
    'voglio sparire per sempre',
    'tutti starebbero meglio senza di me',
    'non ho motivo di vivere',
    'questa è la mia ultima notte',
    'ho deciso di morire',

    // ===== ITALIAN — Self-Harm =====
    'voglio farmi del male',
    'mi faccio del male di proposito',
    'voglio tagliarmi',
    'mi taglio apposta',
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
    'zindagi khatam kar lena chahta hoon',

    // ===== HINDI — Self-Harm =====
    'main apne aap ko takleef dena chahta hoon',
    'main khud ko zakhmi karna chahta hoon',
    'main khud ko kaatna chahta hoon',
    'mujhe dard chahiye',
    'main saza chahta hoon apne aap ko',
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
    'artık yaşayamıyorum',
    'yaşamak istemiyorum',
    'sonsuza kadar kaybolmak istiyorum',
    'bensiz herkes daha iyi olur',
    'yaşamaya devam etmek istemiyorum',
    'bu benim son gecem',
    'ölmeye karar verdim',

    // ===== TURKISH — Self-Harm =====
    'kendime zarar vermek istiyorum',
    'kendimi kesmek istiyorum',
    'kendimi kasıtlı olarak kesiyorum',
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
    'я решил умереть',

    // ===== RUSSIAN — Self-Harm =====
    'я хочу причинить себе вред',
    'я режу себя намеренно',
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
    '我决定去死',

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
    '죽기로 결심했어',

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
    'saya memutuskan untuk mati',

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
    'nimeamua kufa',

    // ===== SWAHILI — Self-Harm =====
    'nataka kujidhuru',
    'ninajikata kwa makusudi',
    'nataka kuhisi maumivu',
    'nastahili maumivu',

    // ===== PUNJABI — Suicide =====
    'main apne aap nu maarna chahunda haan',
    'main khatam ho jaana chahunda haan',
    'mujhe jeona nahi',
    'main mar jaana chahunda haan',
    'sab mere bina changey rahange',
    'jeene di koi wajah nahi',

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
    'i feel like giving up on life',
    'life is too hard to continue',
    'i don\'t see a way out of this',
    'i feel completely trapped',
    'nothing will ever get better for me',
    'i am a burden to everyone',
    'i just want the pain to stop forever',

    // ===== URDU =====
    'zindagi ka koi matlab nahi mujhe',
    'sab log bina mere behtar honge',
    'main haar maan gayi hoon zindagi se',
    'main haar maan gaya hoon zindagi se',
    'zindagi bahut mushkil hai ab',
    'koi raasta nahi dikhta mujhe',
    'main phas gayi hoon is zindagi mein',
    'main phas gaya hoon is zindagi mein',
    'kabhi kuch behtar nahi hoga mere liye',
    'main sab ki bojh hoon',
    'dard khatam karna chahti hoon hamesha ke liye',
    'dard khatam karna chahta hoon hamesha ke liye',

    // ===== SPANISH =====
    'no puedo continuar así',
    'no hay razón para seguir viviendo',
    'todos estarían mejor sin mi presencia',
    'quiero rendirme de vivir',
    'me siento completamente atrapado',
    'nunca mejorará mi situación',
    'soy una carga para todos',

    // ===== FRENCH =====
    'je ne peux plus continuer à vivre',
    'il n\'y a pas de raison de continuer à vivre',
    'tout le monde serait mieux sans moi',
    'je veux abandonner ma vie',
    'je me sens complètement piégé',
    'rien n\'ira jamais mieux pour moi',
    'je suis un fardeau pour tout le monde',

    // ===== ARABIC =====
    'لا يمكنني الاستمرار في هذه الحياة',
    'لا فائدة من الاستمرار في العيش',
    'الجميع سيكونون أفضل بدوني',
    'أنا محاصر في هذه الحياة',
    'أنا عبء على الجميع',

    // ===== GERMAN =====
    'ich kann nicht mehr weiterleben',
    'alle wären besser ohne mich dran',
    'ich fühle mich vollständig gefangen',
    'es wird nie besser für mich',
    'ich bin eine last für alle',

    // ===== HINDI =====
    'main aur jee nahi sakta in zindagi mein',
    'jeene ka koi matlab nahi mera',
    'main haar maan gaya hoon zindagi se',
    'main fasa hoon is zindagi mein',
    'main sab ke liye bojh hoon',

    // ===== TURKISH =====
    'artık yaşamaya devam edemiyorum',
    'herkes bensiz daha iyi olurdu',
    'çıkış yolu göremiyorum hayatımda',
    'herkese yük oluyorum',
  ],

  // NOTE: Methods only score when paired with an intent verb (see calculatePatternScore)
  methods: [
    // ===== ENGLISH =====
    'pills', 'rope', 'bridge', 'gun', 'knife', 'overdose',
    'hanging', 'jumping', 'drowning', 'cutting', 'poison',
    'razor', 'blade', 'medication', 'firearm', 'weapon',

    // ===== URDU =====
    'goli', 'rassee', 'pul se', 'bandook', 'chaku', 'dawai',
    'latakna', 'koodna', 'dubna', 'kaatna', 'zehar',

    // ===== SPANISH =====
    'pastillas', 'cuerda', 'puente', 'arma', 'cuchillo', 'sobredosis',
    'ahorcamiento', 'saltar', 'veneno', 'navaja',

    // ===== FRENCH =====
    'pilules', 'corde', 'pont', 'couteau', 'overdose',
    'pendaison', 'sauter du', 'poison', 'lame',

    // ===== ARABIC =====
    'حبوب للانتحار', 'حبل للانتحار', 'جسر للقفز', 'سكين لجرح نفسي', 'جرعة زائدة', 'سم لشرب',

    // ===== GERMAN =====
    'pillen nehmen zum', 'seil zum', 'brücke springen', 'messer benutzen', 'überdosis nehmen', 'gift nehmen',

    // ===== HINDI =====
    'rassi se latakna', 'pul se koodna', 'chhuri se kaatna', 'jahar peena', 'dawai ki overdose',

    // ===== TURKISH =====
    'hap içmek için', 'ip ile asmak', 'köprüden atlamak', 'bıçakla kesmek', 'zehir içmek',
  ],

  temporal: [
    // ===== ENGLISH =====
    'tonight is my last', 'very soon i will', 'this is my last',
    'final goodbye', 'last time i will', 'end is near for me',
    'won\'t be here tomorrow', 'won\'t wake up tomorrow',

    // ===== URDU =====
    'aaj raat meri aakhri raat', 'bahut jaldi khatam kar lunga', 'yeh meri aakhri',
    'ant kareeb hai mera', 'aakhri alvida', 'kal tak nahi rahunga',

    // ===== SPANISH =====
    'esta noche es mi última', 'muy pronto lo haré', 'última vez que escribo',
    'el fin está cerca para mí', 'no estaré aquí mañana',

    // ===== FRENCH =====
    'ce soir est ma dernière', 'très bientôt je le ferai', 'dernière fois que j\'écris',
    'la fin est proche pour moi', 'je ne serai plus là demain',

    // ===== ARABIC =====
    'الليلة هي ليلتي الأخيرة', 'قريباً جداً سأفعل ذلك', 'آخر مرة أكتب',
    'النهاية قريبة مني', 'لن أكون هنا غداً',

    // ===== GERMAN =====
    'heute nacht ist meine letzte', 'sehr bald werde ich es tun',
    'das letzte mal dass ich schreibe', 'das ende ist nah für mich',

    // ===== HINDI =====
    'aaj raat meri aakhri raat hai', 'bahut jaldi khatam kar lunga', 'aakhri baar likh raha hoon',
    'ant kareeb hai mera', 'kal tak nahi rahunga',

    // ===== TURKISH =====
    'bu gece son gecem', 'çok yakında yapacağım', 'son kez yazıyorum',
    'son benim için yakın', 'yarın burada olmayacağım',
  ],

  emotional_distress: [
    // NOTE: These ONLY add to score when base score > 0 (see calculatePatternScore)

    // ===== ENGLISH =====
    'hopeless', 'worthless', 'empty inside', 'completely numb', 'totally broken',
    'completely alone', 'abandoned by everyone', 'rejected by everyone',
    'total failure', 'completely useless',

    // ===== URDU =====
    'be umeed hoon', 'bekar hoon main', 'bilkul khali hoon',
    'bilkul sunn hoon', 'tuta hua hoon', 'tuti hui hoon',
    'bilkul akeli hoon', 'bilkul akela hoon', 'sabne chhod diya',
    'naakam hoon main', 'laachaar hoon main',
    'bahut dukhi hoon', 'bahut pareshan hoon',

    // ===== SPANISH =====
    'completamente desesperado', 'completamente inútil', 'vacío por dentro',
    'completamente solo', 'abandonado por todos', 'un completo fracaso',

    // ===== ARABIC =====
    'يائس تماماً', 'عديم القيمة تماماً', 'فارغ من الداخل',
    'وحيد تماماً', 'مهجور من الجميع', 'فاشل تماماً',

    // ===== GERMAN =====
    'völlig hoffnungslos', 'völlig wertlos', 'innerlich leer',
    'völlig allein', 'von allen verlassen', 'totales versagen',

    // ===== HINDI =====
    'bilkul nihasa hoon', 'bilkul behkaar hoon', 'bilkul khali hoon',
    'bilkul akela hoon', 'bilkul akeli hoon', 'sabne chhod diya',

    // ===== TURKISH =====
    'tamamen umutsuzum', 'tamamen değersizim', 'içim boş',
    'tamamen yalnızım', 'herkes tarafından terk edildim',
  ]
};

const CONTEXTUAL_RISK_INDICATORS = {
  isolation: [
    'no one cares about me', 'all alone in this world', 'nobody understands me', 'no real friends',
    'koi care nahi karta mujhse', 'bilkul akeli is duniya mein', 'bilkul akela is duniya mein',
    'koi samajhta nahi mujhe', 'koi sachha dost nahi',
    'nadie se preocupa por mí', 'personne ne se soucie de moi',
    'niemand kümmert sich um mich', 'kimse beni umursamıyor',
  ],
  plan_formation: [
    'i have thought about exactly how', 'i have been planning this',
    'i know exactly how i will do it', 'i\'ve made specific plans',
    'everything is ready for me to', 'i\'ve decided exactly when',
    'main soch chuki hoon kaise karunga', 'main plan bana rahi hoon is ka',
    'maine faisla kiya hai kab karunga',
    'he pensado exactamente cómo', 'j\'ai décidé exactement quand',
    'ich habe genau entschieden wann',
  ],
  means_access: [
    'i have access to the means', 'i can get what i need to do it',
    'i already have everything i need',
    'mere paas sab kuch hai jo chahiye', 'main la sakti hoon jo chahiye',
    'tengo acceso a los medios', 'j\'ai accès à ce qu\'il faut',
    'ich habe zugang zu den mitteln',
  ],
  timeline: [
    'very soon now', 'tonight for sure', 'today is the day', 'this week is my last',
    'final decision made', 'last message to you',
    'aaj raat pakka', 'aaj ka din hai', 'is hafte mera aakhri',
    'esta noche seguro', 'ce soir c\'est sûr', 'heute nacht sicher',
  ],
  finality: [
    'final decision is made', 'i\'ve completely made up my mind',
    'there\'s absolutely no going back', 'i\'m completely done with life',
    'no more second chances for me', 'point of no return reached',
    'aakhri faisla ho gaya hai', 'ab wapas nahi ja sakti bilkul',
    'ab wapas nahi ja sakta bilkul',
    'decisión final tomada', 'décision finale prise',
    'endgültige entscheidung getroffen',
  ]
};

// ============================================================
// INTENT VERBS — used to validate method mentions
// A method word only scores when one of these appears nearby
// ============================================================
const INTENT_VERBS = [
  // English
  'want to', 'going to', 'will use', 'plan to', 'decided to',
  'have a ', 'using a', 'use a', 'with a ', 'got a ', 'get a ',
  'overdose on', 'take my own', 'swallow',
  // Urdu/Hindi
  'se khatam', 'se maarna', 'se kaatna', 'se latakna', 'se koodna',
  'lena chahta', 'lena chahti', 'istamal karunga', 'istamal karungi',
  // Spanish
  'quiero usar', 'voy a usar', 'voy a tomar', 'tengo un',
  // French
  'veux utiliser', 'vais utiliser', 'avec un', 'ai un',
  // German
  'will benutzen', 'werde benutzen', 'mit einem',
  // Turkish
  'kullanmak istiyorum', 'ile yapmak istiyorum',
];

class EnhancedSuicideDetector {
  constructor() {}

  private calculatePatternScore(text: string): { score: number; matchedPatterns: string[]; emotionCount: number } {
    const lowerText = text.toLowerCase();
    let score = 0;
    const matchedPatterns: string[] = [];
    let emotionCount = 0;

    // Direct patterns — full phrases, safe to score always
    for (const pattern of ENHANCED_SUICIDE_PATTERNS.direct) {
      if (lowerText.includes(pattern)) {
        score += 10;
        matchedPatterns.push(`Direct threat: "${pattern}"`);
      }
    }

    // Indirect patterns — full phrases, safe to score always
    for (const pattern of ENHANCED_SUICIDE_PATTERNS.indirect) {
      if (lowerText.includes(pattern)) {
        score += 6;
        matchedPatterns.push(`Indirect indicator: "${pattern}"`);
      }
    }

    // Methods — ONLY score when an intent verb is also present
    // Prevents false positives like "bridge to nowhere" or "cutting vegetables"
    const hasIntentVerb = INTENT_VERBS.some(v => lowerText.includes(v));
    for (const method of ENHANCED_SUICIDE_PATTERNS.methods) {
      if (lowerText.includes(method) && hasIntentVerb) {
        score += 8;
        matchedPatterns.push(`Method + intent: "${method}"`);
      }
    }

    // Temporal — full phrases, safe
    for (const temporal of ENHANCED_SUICIDE_PATTERNS.temporal) {
      if (lowerText.includes(temporal)) {
        score += 7;
        matchedPatterns.push(`Temporal indicator: "${temporal}"`);
      }
    }

    // Emotional distress — count only; added to score conditionally in analyzeSuicideRisk
    for (const emotion of ENHANCED_SUICIDE_PATTERNS.emotional_distress) {
      if (lowerText.includes(emotion)) {
        emotionCount++;
        matchedPatterns.push(`Emotional distress: "${emotion}"`);
      }
    }

    return { score, matchedPatterns, emotionCount };
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

    // ── STEP 1: Informational query check ──────────────────────────────────
    // Questions like "is suicide good or bad?" must NEVER trigger crisis
    if (isInformationalQuery(text)) {
      return {
        riskLevel: 'low',
        confidence: 0,
        riskFactors: [],
        contextualCues: ['Message is an informational/educational question — not a personal crisis'],
        mcpClassification: false,
        recommendedAction: 'Respond normally with educational or supportive information.',
        flagged: false,
        reason: 'Informational query detected — no crisis response needed'
      };
    }

    // ── STEP 2: Self-referential check ─────────────────────────────────────
    // "my friend wants to die" should not trigger crisis for the user
    if (!isAboutSelf(text)) {
      return {
        riskLevel: 'low',
        confidence: 0,
        riskFactors: [],
        contextualCues: ['Message is about a third party, not the user themselves'],
        mcpClassification: false,
        recommendedAction: 'No crisis action required — message is about someone else. Offer guidance on how to support that person.',
        flagged: false,
        reason: 'Third-party reference detected'
      };
    }

    // ── STEP 3: Full risk analysis ─────────────────────────────────────────
    const basicCheck = checkContent(text);
    const patternAnalysis = this.calculatePatternScore(text);
    const contextualAnalysis = this.analyzeContextualRisk(text, context);
    const mcpClassification = await this.callMCPClassifier(text);

    // Emotional distress words only boost score if other risk indicators already exist
    const emotionBoost = patternAnalysis.score > 0 ? patternAnalysis.emotionCount * 3 : 0;
    const totalScore = patternAnalysis.score + contextualAnalysis.score + emotionBoost;

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
  isInformationalQuery,
};

