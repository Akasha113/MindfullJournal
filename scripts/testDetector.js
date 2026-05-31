// Lightweight JS harness that mimics key logic from enhancedSuicideDetection.ts
// Runs without TypeScript tools or additional installs.

const INFORMATIONAL_INDICATORS = [
  'is suicide', 'why do people', 'what is suicide', 'suicide prevention', 'my essay', 'good or bad', 'how do i help', 'what are the signs'
];

const SELF_REFERENTIAL_INDICATORS = ['i want', "i'm", 'i am', 'i will', 'i feel', 'mujhe', 'main ', 'yo quiero', 'je veux'];
const THIRD_PERSON_INDICATORS = ['my friend', 'my brother', 'he wants', 'she wants', 'they want', 'mera dost', 'woh chahta'];

const DIRECT = ['i have pills', 'i have a gun', 'i want to kill myself', 'i am going to kill myself', 'i want to end it all'];
const INDIRECT = ['i cant take it anymore', 'no reason to live', 'i am a burden', 'i just want the pain to stop'];
const METHODS = ['pills','rope','bridge','gun','knife','overdose','hanging','jumping','drowning','cutting'];
const INTENT_VERBS = ['want to','going to','plan to','will','going to use','lena chahta','quiero','je veux','ich will'];
const TEMPORAL = ['tonight','very soon','this is my last'];
const EMOTIONS = ['hopeless','worthless','alone','empty','udass','dukhi','pareshan'];

function lower(s){return (s||'').toLowerCase();}

function isInformationalQuery(text){
  const lowerText = lower(text);
  for(const ind of INFORMATIONAL_INDICATORS) if(lowerText.includes(ind)) return true;
  if(lowerText.trim().endsWith('?')){
    // if no explicit self-harm verbs, treat as informational
    const verbs = ['want to','kill myself','suicid','die','overdose','hurt myself','kill'];
    const hasVerb = verbs.some(v=>lowerText.includes(v));
    return !hasVerb && lowerText.length < 200;
  }
  return false;
}

function isAboutSelf(text){
  const lowerText = lower(text);
  for(const t of THIRD_PERSON_INDICATORS) if(lowerText.includes(t)) return false;
  for(const t of SELF_REFERENTIAL_INDICATORS) if(lowerText.includes(t)) return true;
  // default to true for safety
  return true;
}

function calculatePatternScore(text){
  const lowerText = lower(text);
  let score = 0;
  const matched = [];
  for(const p of DIRECT) if(lowerText.includes(p)) { score += 10; matched.push('direct:'+p); }
  for(const p of INDIRECT) if(lowerText.includes(p)) { score += 6; matched.push('indirect:'+p); }
  const hasIntent = INTENT_VERBS.some(v=>lowerText.includes(v));
  for(const m of METHODS) if(lowerText.includes(m) && hasIntent) { score += 8; matched.push('method:'+m); }
  for(const t of TEMPORAL) if(lowerText.includes(t)) { score += 7; matched.push('temporal:'+t); }
  let emotionCount = 0;
  for(const e of EMOTIONS) if(lowerText.includes(e)) { emotionCount++; matched.push('emotion:'+e); }
  return {score, matched, emotionCount};
}

function determineRiskLevel(score){
  if(score >= 15) return 'critical';
  if(score >= 10) return 'high';
  if(score >= 5) return 'medium';
  return 'low';
}

function analyze(text){
  if(isInformationalQuery(text)) return {riskLevel:'low', reason:'informational'};
  if(!isAboutSelf(text)) return {riskLevel:'low', reason:'third-party'};
  const pattern = calculatePatternScore(text);
  const emotionBoost = pattern.score > 0 ? pattern.emotionCount * 3 : 0;
  const total = pattern.score + emotionBoost;
  const riskLevel = determineRiskLevel(total);
  return {riskLevel, total, matched: pattern.matched, emotionCount: pattern.emotionCount};
}

const samples = [
  'Is suicide good or bad?',
  'I have pills and I plan to use them tonight',
  'I feel so alone and empty',
  'I was cutting vegetables on the bridge',
  'My friend said they want to die',
  'I keep thinking about jumping off the bridge tonight',
  'I am going to kill myself',
  'Why do people commit suicide?'
];

for(const s of samples){
  const info = isInformationalQuery(s);
  const about = isAboutSelf(s);
  const analysis = analyze(s);
  console.log('---');
  console.log('Message:', s);
  console.log('isInformationalQuery:', info, 'isAboutSelf:', about);
  console.log('Analysis:', analysis);
}
