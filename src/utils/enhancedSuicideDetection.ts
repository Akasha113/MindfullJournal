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

// Enhanced suicide-related phrases with context patterns (Multiple Languages)
// CRITICAL: All keywords marked for immediate crisis detection
const ENHANCED_SUICIDE_PATTERNS = {
  direct: [
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
    'sab kuch khatam kar doon',
    'zindagi se nikalna chahti hoon',
    'zindagi se nikalna chahta hoon',
    
    // ===== SPANISH =====
    'no puedo seguir',
    'no hay razón para vivir',
    'todos estarían mejor sin mí',
    'quiero rendirme',
    'la vida es demasiado difícil',
    'no veo salida',
    'me siento atrapado',
    'nunca mejorará',
    'soy una carga para todos',
    'solo quiero que el dolor termine',
    
    // ===== FRENCH =====
    'je ne peux pas continuer',
    'il n\'y a pas de raison de vivre',
    'tout le monde serait mieux sans moi',
    'je veux abandonner',
    'la vie est trop difficile',
    'je ne vois pas d\'issue',
    'je me sens piégé',
    'rien n\'ira jamais mieux',
    'je suis un fardeau pour tout le monde',
    'je veux juste que la douleur s\'arrête',
    
    // ===== ARABIC =====
    'لا يمكنني المتابعة',
    'لا فائدة من العيش',
    'الجميع سيكونون أفضل بدوني',
    'أريد الاستسلام',
    'الحياة صعبة جداً',
    'لا أرى مخرجاً',
    'أنا محاصر',
    'لن يتحسن شيء',
    'أنا عبء على الجميع',
    
    // ===== PORTUGUESE =====
    'não posso mais',
    'não há razão para viver',
    'todos estariam melhor sem mim',
    'quero desistir',
    'a vida é muito difícil',
    'não vejo saída',
    'me sinto preso',
    'nunca vai melhorar',
    'sou um peso para todos',
    
    // ===== GERMAN =====
    'ich kann nicht mehr',
    'es gibt keinen Grund zu leben',
    'alle wären besser ohne mich',
    'ich will aufgeben',
    'das Leben ist zu schwer',
    'ich sehe keinen Ausweg',
    'ich fühle mich gefangen',
    'es wird nie besser',
    'ich bin eine Last für alle',
    
    // ===== ITALIAN =====
    'non riesco a continuare',
    'non c\'è motivo di vivere',
    'tutti staremmo meglio senza di me',
    'voglio rinunciare',
    'la vita è troppo difficile',
    'non vedo una via d\'uscita',
    'mi sento intrappolato',
    'niente migliorerà mai',
    'sono un peso per tutti',
    
    // ===== HINDI =====
    'main aur jee nahi sakta',
    'jeene ka koi matlab nahi',
    'sab mujhe chod kar chale jayenge',
    'main haar maan gaya hoon',
    'zindagi bahut mushkil hai',
    'koi rasta nahi dikhta',
    'main fasa hoon',
    'ab kabhi achcha nahi hoga',
    'main sab ke liye bojh hoon',
    
    // ===== BENGALI =====
    'ami abar chalte parchhi na',
    'jibanar koi mane nai',
    'sabai amake chhara bhalo thakta',
    'ami haari mane gecchhui',
    'jibon aro kathin',
    'kono rasta nai',
    
    // ===== TURKISH =====
    'devam edemiyorum',
    'yaşamak için hiçbir neden yok',
    'herkes bensiz daha iyi olurdu',
    'pes geçmek istiyorum',
    'hayat çok zor',
    'çıkış yolu göremiyorum',
    'tuzağa düştüm',
    'hiçbir şey iyileşmeyecek',
    'herkesin yükü olmak'
  ],
  methods: [
    // ===== ENGLISH =====
    'pills', 'rope', 'bridge', 'gun', 'knife', 'overdose',
    'hanging', 'jumping', 'drowning', 'cutting', 'poison',
    
    // ===== URDU =====
    'goli', 'rassee', 'pul', 'bandook', 'chaku', 'dawai',
    'latakna', 'koodna', 'dubna', 'kaatna', 'zehar',
    'dawai ki over dose', 'khud ko kaatna', 'khud ko jalan',
    
    // ===== SPANISH =====
    'pastillas', 'cuerda', 'puente', 'arma', 'cuchillo', 'sobredosis',
    'ahorcamiento', 'saltar', 'ahogamiento', 'cortadas', 'veneno',
    
    // ===== FRENCH =====
    'pilules', 'corde', 'pont', 'arme', 'couteau', 'overdose',
    'pendaison', 'sauter', 'noyade', 'coupures', 'poison',
    
    // ===== ARABIC =====
    'حبوب', 'حبل', 'جسر', 'سلاح', 'سكين', 'جرعة زائدة',
    'شنق', 'قفز', 'غرق', 'جروح', 'سم',
    
    // ===== PORTUGUESE =====
    'pílulas', 'corda', 'ponte', 'arma', 'faca', 'overdose',
    'enforcamento', 'pular', 'afogamento', 'cortes', 'veneno',
    
    // ===== GERMAN =====
    'pillen', 'seil', 'brücke', 'waffe', 'messer', 'überdosis',
    'erhängen', 'springen', 'ertrinken', 'schnitte', 'gift',
    
    // ===== ITALIAN =====
    'pillole', 'corda', 'ponte', 'arma', 'coltello', 'overdose',
    'impiccagione', 'saltare', 'annegamento', 'tagli', 'veleno',
    
    // ===== HINDI =====
    'goli', 'rassi', 'pul', 'bandook', 'chhuri', 'jahar',
    'latakna', 'koodna', 'doobna', 'kaatna', 'zahr',
    
    // ===== BENGALI =====
    'aushadh', 'rassi', 'pul', 'janto', 'chhuri', 'bisash',
    'phasiye dea', 'jaaye pada', 'jal e dooba',
    
    // ===== TURKISH =====
    'hap', 'ip', 'köprü', 'silah', 'bıçak', 'uyuşturucu',
    'asılmak', 'sıçramak', 'boğulmak', 'kesikler', 'zehir'
  ],
  temporal: [
    // ===== ENGLISH =====
    'tonight', 'today', 'tomorrow', 'this weekend', 'soon',
    'when i get home', 'after this', 'in the morning',
    
    // ===== URDU =====
    'aaj raat', 'aaj', 'kal', 'is hafte', 'jaldi',
    'jab ghar pahunchun', 'iske baad', 'subah',
    'abhi', 'foran', 'turant', 'bahut jaldi',
    
    // ===== SPANISH =====
    'esta noche', 'hoy', 'mañana', 'este fin de semana', 'pronto',
    'cuando llegue a casa', 'después de esto', 'por la mañana',
    
    // ===== FRENCH =====
    'ce soir', 'aujourd\'hui', 'demain', 'ce week-end', 'bientôt',
    'quand je rentre à la maison', 'après cela', 'le matin',
    
    // ===== ARABIC =====
    'الليلة', 'اليوم', 'غداً', 'هذا الأسبوع', 'قريباً',
    'عندما أصل إلى البيت', 'بعد ذلك', 'صباحاً',
    
    // ===== PORTUGUESE =====
    'esta noite', 'hoje', 'amanhã', 'este fim de semana', 'em breve',
    'quando chegar em casa', 'depois disso', 'pela manhã',
    
    // ===== GERMAN =====
    'heute nacht', 'heute', 'morgen', 'dieses wochenende', 'bald',
    'wenn ich nach hause komme', 'danach', 'am morgen',
    
    // ===== ITALIAN =====
    'stasera', 'oggi', 'domani', 'questo fine settimana', 'presto',
    'quando torno a casa', 'dopo questo', 'al mattino',
    
    // ===== HINDI =====
    'aaj raat', 'aaj', 'kal', 'is hafte', 'jaldi',
    'jab ghar aun', 'iske baad', 'subah',
    
    // ===== BENGALI =====
    'aj raat', 'aj', 'kal', 'ei saptahe', 'shigghrei',
    'bari fire aile', 'er pare', 'prater bela',
    
    // ===== TURKISH =====
    'bu gece', 'bugün', 'yarın', 'bu hafta sonu', 'yakında',
    'eve gittiğimde', 'bundan sonra', 'sabah'
  ],
  emotional_distress: [
    // ===== ENGLISH =====
    'hopeless', 'worthless', 'empty', 'numb', 'broken',
    'alone', 'abandoned', 'rejected', 'failure', 'useless',
    
    // ===== URDU =====
    'be umeed', 'bekar', 'khali', 'sunn', 'tota',
    'akeli', 'akela', 'chhoda gaya', 'rad kar diya',
    'naakam', 'lafanga', 'laachaar', 'bebas',
    'dukhi', 'pareshan', 'ghamgin', 'udass',
    
    // ===== SPANISH =====
    'desesperado', 'inútil', 'vacío', 'adormecido', 'roto',
    'solo', 'abandonado', 'rechazado', 'fracaso', 'inservible',
    'deprimido', 'angustia', 'tristeza', 'dolor',
    
    // ===== FRENCH =====
    'désespéré', 'inutile', 'vide', 'engourdi', 'brisé',
    'seul', 'abandonné', 'rejeté', 'échec', 'inutile',
    'déprimé', 'détresse', 'tristesse', 'souffrance',
    
    // ===== ARABIC =====
    'يائس', 'عديم القيمة', 'فارغ', 'خدر', 'مكسور',
    'وحيد', 'مهجور', 'مرفوض', 'فشل', 'عديم الفائدة',
    'حزين', 'منزعج', 'غم', 'ألم',
    
    // ===== PORTUGUESE =====
    'desesperado', 'inútil', 'vazio', 'dormente', 'quebrado',
    'sozinho', 'abandonado', 'rejeitado', 'fracasso', 'imprestável',
    'deprimido', 'angústia', 'tristeza', 'sofrimento',
    
    // ===== GERMAN =====
    'hoffnungslos', 'wertlos', 'leer', 'taub', 'zerbrochen',
    'allein', 'verlassen', 'abgelehnt', 'versagen', 'nutzlos',
    'deprimiert', 'angst', 'trauer', 'leid',
    
    // ===== ITALIAN =====
    'disperato', 'inutile', 'vuoto', 'intorpidito', 'spezzato',
    'solo', 'abbandonato', 'rifiutato', 'fallimento', 'inutile',
    'depresso', 'angoscia', 'tristezza', 'sofferenza',
    
    // ===== HINDI =====
    'nihasa', 'behkaar', 'khali', 'suna', 'tota',
    'akela', 'paritrakt', 'alnkar', 'nashaboon', 'byarth',
    'udas', 'pareshaan', 'dukhi', 'bhaari',
    
    // ===== BENGALI =====
    'aasha-hara', 'worthless', 'sunna', 'nirmom', 'bhenkalo',
    'akendra', 'paritakta', 'ostreekrit', 'abibhal', 'bybohaar',
    'kharo', 'bipod', 'kandali', 'dukh',
    
    // ===== TURKISH =====
    'umutsuz', 'değersiz', 'boş', 'uyuşmuş', 'kırılmış',
    'yalnız', 'terk edilmiş', 'reddedilmiş', 'başarısız', 'işe yaramaz',
    'depresif', 'ızdırap', 'üzüntü', 'acı'
  ]
};

// Context-aware risk assessment patterns (Multiple Languages)
// CRITICAL: All keywords marked for immediate crisis detection
const CONTEXTUAL_RISK_INDICATORS = {
  isolation: [
    // ===== ENGLISH =====
    'no one cares', 'all alone', 'nobody understands', 'no friends',
    
    // ===== URDU =====
    'koi care nahi karta', 'bilkul akeli', 'bilkul akela', 'koi samajhta nahi',
    'koi dost nahi', 'sab mujhe chhod gaye', 'koi mere saath nahi',
    
    // ===== SPANISH =====
    'nadie se preocupa', 'completamente solo', 'nadie entiende', 'sin amigos',
    'abandonado por todos', 'sin nadie a mi lado',
    
    // ===== FRENCH =====
    'personne ne s\'en soucie', 'complètement seul', 'personne ne comprend', 'pas d\'amis',
    'abandonné par tous', 'sans personne à mes côtés',
    
    // ===== ARABIC =====
    'لا أحد يهتم', 'وحيد تماماً', 'لا أحد يفهم', 'لا أصدقاء',
    'مهجور من الجميع', 'بدون أحد بجانبي',
    
    // ===== PORTUGUESE =====
    'ninguém se preocupa', 'completamente sozinho', 'ninguém entende', 'sem amigos',
    'abandonado por todos', 'sem ninguém ao meu lado',
    
    // ===== GERMAN =====
    'niemand kümmert sich', 'ganz allein', 'niemand versteht', 'keine freunde',
    'von allen verlassen', 'ohne jemanden an meiner seite',
    
    // ===== ITALIAN =====
    'nessuno se ne importa', 'completamente solo', 'nessuno capisce', 'nessun amico',
    'abbandonato da tutti', 'senza nessuno al mio fianco',
    
    // ===== HINDI =====
    'kisi ko fark nahi padta', 'bilkul akela', 'koi nahi samjhta', 'koi dost nahi',
    'sabne mujhe chhod diya', 'koi mere saath nahi',
    
    // ===== BENGALI =====
    'keu ki pore na', 'bilkul akena', 'keu bujan na', 'keu sathi nai',
    'sab amake chhare gecchhei', 'keu amader sath nai',
    
    // ===== TURKISH =====
    'kimse umursamıyor', 'tamamen yalnız', 'kimse anlamıyor', 'arkadaş yok',
    'hepsi tarafından terk edilmiş', 'yanımda kimse yok'
  ],
  plan_formation: [
    // ===== ENGLISH =====
    'i have thought about', 'i have been planning', 'i know exactly how',
    'i\'ve made plans', 'everything is ready', 'i\'ve decided',
    
    // ===== URDU =====
    'main soch chuki hoon', 'main soch chuka hoon', 'main plan bana rahi hoon',
    'main plan bana raha hoon', 'main jaanti hoon kaise', 'main jaanta hoon kaise',
    'mujhe pata hai kaise karna hai', 'maine socha hai', 'maine faisla kiya hai',
    
    // ===== SPANISH =====
    'he pensado en ello', 'he estado planeando', 'sé exactamente cómo',
    'he hecho planes', 'todo está listo', 'he decidido',
    
    // ===== FRENCH =====
    'j\'y ai pensé', 'je suis en train de planifier', 'je sais exactement comment',
    'j\'ai fait des plans', 'tout est prêt', 'j\'ai décidé',
    
    // ===== ARABIC =====
    'فكرت في الأمر', 'كنت أخطط', 'أعرف بالضبط كيف',
    'وضعت خطط', 'كل شيء جاهز', 'قررت',
    
    // ===== PORTUGUESE =====
    'pensei em tudo', 'estive planejando', 'sei exatamente como',
    'fiz planos', 'tudo está pronto', 'decidi',
    
    // ===== GERMAN =====
    'ich habe darüber nachgedacht', 'ich plane', 'ich weiß genau wie',
    'ich habe pläne gemacht', 'alles ist bereit', 'ich habe entschieden',
    
    // ===== ITALIAN =====
    'ci ho pensato', 'stavo pianificando', 'so esattamente come',
    'ho fatto piani', 'tutto è pronto', 'ho deciso',
    
    // ===== HINDI =====
    'mujhe sab pata hai', 'main plan bana raha hoon', 'maine faisla kar liya',
    'sb tayyar hai', 'main jaanta hoon kaise',
    
    // ===== BENGALI =====
    'ami vebhechhui', 'ami plan kore rachhui', 'ami jaani ki vabe',
    'sb ready', 'amne faisla kore fellam',
    
    // ===== TURKISH =====
    'üzerinde düşündüm', 'planlıyorum', 'tam olarak nasıl yapacağımı biliyorum',
    'planlar yaptım', 'her şey hazır', 'karar verdim'
  ],
  means_access: [
    // ===== ENGLISH =====
    'i have access to', 'i can get', 'i already have',
    'it\'s nearby', 'i possess', 'readily available',
    
    // ===== URDU =====
    'mere paas hai', 'main la sakti hoon', 'main la sakta hoon', 'pehle se hi hai',
    'mere paas uda hai', 'main le sakti hoon', 'mere paas tha',
    
    // ===== SPANISH =====
    'tengo acceso a', 'puedo conseguir', 'ya tengo',
    'está cerca', 'poseo', 'fácilmente disponible',
    
    // ===== FRENCH =====
    'j\'ai accès à', 'je peux obtenir', 'j\'ai déjà',
    'c\'est à proximité', 'je possède', 'facilement disponible',
    
    // ===== ARABIC =====
    'لدي وصول إلى', 'يمكنني الحصول على', 'لدي بالفعل',
    'إنه قريب', 'أملك', 'متاح بسهولة',
    
    // ===== PORTUGUESE =====
    'tenho acesso a', 'posso conseguir', 'já tenho',
    'está perto', 'possuo', 'facilmente disponível',
    
    // ===== GERMAN =====
    'ich habe zugang zu', 'ich kann bekommen', 'ich habe bereits',
    'es ist in der nähe', 'ich besitze', 'leicht verfügbar',
    
    // ===== ITALIAN =====
    'ho accesso a', 'posso ottenere', 'ho già',
    'è vicino', 'posseggo', 'facilmente disponibile',
    
    // ===== HINDI =====
    'mere paas hai', 'main le sakta hoon', 'mera paas uda tha',
    'baat kareeb hai', 'mere paas hai', 'aasan se milta hai',
    
    // ===== BENGALI =====
    'amader kase ache', 'ami pawa jabi', 'amar kase phela ache',
    'kache ache', 'amar sompod', 'asanei pawa jay',
    
    // ===== TURKISH =====
    'erişimim var', 'alabilirim', 'zaten var',
    'yakında', 'sahibim', 'kolayca ulaşılabilir'
  ],
  timeline: [
    // ===== ENGLISH =====
    'very soon', 'tonight', 'today', 'this week',
    'final', 'last', 'end is near', 'count down',
    
    // ===== URDU =====
    'bahut jaldi', 'aaj raat', 'aaj', 'is hafte', 'abhi',
    'aakhri', 'akher', 'ant kareeb hai', 'ginatee',
    
    // ===== SPANISH =====
    'muy pronto', 'esta noche', 'hoy', 'esta semana',
    'final', 'último', 'el fin está cerca', 'cuenta regresiva',
    
    // ===== FRENCH =====
    'très bientôt', 'ce soir', 'aujourd\'hui', 'cette semaine',
    'final', 'dernier', 'la fin est proche', 'compte à rebours',
    
    // ===== ARABIC =====
    'قريباً جداً', 'الليلة', 'اليوم', 'هذا الأسبوع',
    'نهائي', 'الأخير', 'النهاية قريبة', 'العد العكسي',
    
    // ===== PORTUGUESE =====
    'muito em breve', 'esta noite', 'hoje', 'esta semana',
    'final', 'último', 'o fim está próximo', 'contagem regressiva',
    
    // ===== GERMAN =====
    'sehr bald', 'heute nacht', 'heute', 'diese woche',
    'final', 'letzt', 'das ende ist nah', 'countdown',
    
    // ===== ITALIAN =====
    'molto presto', 'stasera', 'oggi', 'questa settimana',
    'finale', 'ultimo', 'la fine è vicina', 'conto alla rovescia',
    
    // ===== HINDI =====
    'bahut jaldi', 'raat ko', 'aaj', 'is hafte ko',
    'aakhri', 'ant ke paas', 'samय khatam',
    
    // ===== BENGALI =====
    'bahut jaldi', 'aj raat', 'aj', 'ei saptahe',
    'sesher kotha', 'aakhri', 'ses kachakachi',
    
    // ===== TURKISH =====
    'çok yakında', 'bu gece', 'bugün', 'bu hafta',
    'son', 'son derece', 'son yakın', 'geri sayım'
  ],
  finality: [
    // ===== ENGLISH =====
    'final decision', 'made up my mind', 'there\'s no going back', 'this is it',
    'i\'m done', 'no more chances', 'point of no return', 'sealed fate',
    
    // ===== URDU =====
    'aakhri faisla', 'mujhe pata hai', 'ab wapas nahi ja sakti', 'ab wapas nahi ja sakta',
    'yahi hai', 'khudkushi karne ka faisla kar liya', 'ab kuch nahi ho sakta',
    'aakhri fursat', 'faisla ho chuka',
    
    // ===== SPANISH =====
    'decisión final', 'tomé mi decisión', 'no hay vuelta atrás', 'esto es',
    'terminé', 'no hay más oportunidades', 'punto de no retorno', 'suerte sellada',
    
    // ===== FRENCH =====
    'décision finale', 'j\'ai pris ma décision', 'pas de retour', 'c\'est tout',
    'j\'ai terminé', 'pas d\'autres chances', 'point de non-retour', 'destin scellé',
    
    // ===== ARABIC =====
    'القرار النهائي', 'اتخذت قراري', 'لا عودة', 'هذا كل شيء',
    'انتهيت', 'لا مزيد من الفرص', 'نقطة اللاعودة', 'مصير محتوم',
    
    // ===== PORTUGUESE =====
    'decisão final', 'já decidi', 'não há volta', 'isto é tudo',
    'terminei', 'não há mais chances', 'ponto de não retorno', 'destino selado',
    
    // ===== GERMAN =====
    'endgültige entscheidung', 'ich habe mich entschieden', 'kein zurück', 'das ist es',
    'ich bin fertig', 'keine zweite chance', 'punkt ohne rückkehr', 'versiegeltes schicksal',
    
    // ===== ITALIAN =====
    'decisione finale', 'ho deciso', 'non c\'è ritorno', 'è tutto',
    'ho finito', 'nessuna altra chance', 'punto di non ritorno', 'destino sigillato',
    
    // ===== HINDI =====
    'aakhri faisla', 'maine faisla kar liya', 'ab koi rast nahi', 'bas itna hi',
    'main khatam', 'ab koi ausav nahi', 'aakhri mauqaa',
    
    // ===== BENGALI =====
    'sesher nischoy', 'amne nischoy korllam', 'ab fere asbar nai', 'bas etai',
    'ami khatam', 'ab ar keu option nai', 'sesher somoi',
    
    // ===== TURKISH =====
    'son karar', 'kararını verdim', 'geri dönüş yok', 'bu kadar',
    'bittim', 'daha fazla şans yok', 'dönüş noktası', 'kaderini mühürlemiş'
  ]
};

class EnhancedSuicideDetector {
  // Removed unused knowledgeBase for now

  constructor() {
    // Removed initializeKnowledgeBase call
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
