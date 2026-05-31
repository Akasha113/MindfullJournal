const CONCERNING_KEYWORDS = [
  'suicide',
  'suicidal',
  'kill myself',
  'kill me',
  'end my life',
  'want to die',
  'die',
  'dying',
  'ending it all',
  'no reason to live',
  'life is not worth living',
  'worthless',
  'hopeless',
  'give up',
  'nothing to live for',
  'self-harm',
  'self harm',
  'cut myself',
  'cutting',
  'hurt myself',
  'harm myself',
  'take my life',
  'overdose',
  'can’t go on',
  'i want to disappear',
  'i don’t want to live',
  'don’t want to be here',
  'ending my life',
  'can’t take it anymore',
  'can’t do this anymore',
  'would be better off dead',
  'rather be dead',
  'maybe if i was gone',

  // Urdu keywords (expanded with variations)
  'khudkushi', 'khudkushi karna', 'khudkushi krna', 'khudlushi', 'khudlushi karna', 'khudlushi krna',
  'jaan lena', 'jaan laina', 'jaan lena chahti hoon', 'jaan laina chahti hoon',
  'jaan lena chahta hoon', 'jaan laina chahta hoon',
  'jaan lena chahti hon', 'jaan lena chahta hon',  // variations with 'hon' instead of 'hoon'
  'marna chahti hoon', 'marna chahta hoon',
  'marna chahti hon', 'marna chahta hon',  // variations with 'hon'
  'khudkushi karne wali hoon', 'khudkushi karne wala hoon',
  'khudkushi krne wali hoon', 'khudkushi krne wala hoon',
  'khudkushi krni hoon', 'khudkushi krna hoon',
  'khudkushi krni hon', 'khudkushi krna hon',
  'zindagi khatam karna', 'zindagi khatam krna',
  'khud ko maarna', 'khud ko marna', 'khud ko khatam karna',
  'jaan se maarna', 'jaan se marna',
  'zindagi se tang aa gayi', 'zindagi se tang aa gaya',
  'zindagi ka koi matlab nahi', 'zindagi ka koyi matlab nahi',
  'zindagi bekar hai', 'zindagi bekas hai',
  'zindagi se nikalna', 'zindagi se bahar nikalna',
  'dard khatam karna', 'dard khatam krna',
  'sab kuch khatam kar doon', 'sab kuch khatam kr doon',
  'khud ko kaatna', 'khud ko katna',
  'khud ko jalan', 'khud ko jalana',
  'zehar khana', 'zehar khaana',
  'dawai ki over dose', 'dawai ki overdose',
  'marne ka faisla kar liya', 'marne ka faisla kr liya',
  'khudkushi karne wali hoon', 'khudkushi karne wala hoon',
  'khudlushi karne wali hoon', 'khudlushi karne wala hoon',
  'zindagi se ghabra gayi hoon', 'zindagi se ghabra gaya hoon',
  'zindagi se ghabra gayi', 'zindagi se ghabra gaya',
  'sab log bina mere behtar honge', 'sab log bina mere better honge',
  'main sab ki bojh hoon', 'main sab ki booj hoon',
  'mn sab ki bojh hoon', 'mn sab ki bojh',  // variations with 'mn'
  'koi mujhe care nahi karta', 'koi mujhe care nahi krta',
  'bilkul akeli hoon', 'bilkul akela hoon',
  'bilkul akeli', 'bilkul akela',
  'koi samajhta nahi', 'koi samajhta nahi hai',
  'zindagi bahut mushkil hai', 'zindagi bohot mushkil hai',
  'koi raasta nahi dikhta', 'koi rasta nahi dikhta',
  'main phas gayi hoon', 'main phas gaya hoon',
  'mn phas gayi hoon', 'mn phas gaya hoon',  // variations with 'mn'
  'main phas gayi', 'main phas gaya',
  'mn phas gayi', 'mn phas gaya',  // variations with 'mn'
  'kabhi kuch behtar nahi hoga', 'kabhi kuch better nahi hoga',
  'be umeed hoon', 'be umeed', 'be umeedi',
  'bekar hoon', 'bekar', 'bekas hoon',
  'laachaar hoon', 'laachaar', 'laachar hoon',
  'bebas hoon', 'bebas', 'bebas hoon',
  'dukhi hoon', 'dukhi', 'dukhiya hoon',
  'pareshan hoon', 'pareshan', 'pareshaan hoon',
  'ghamgin hoon', 'ghamgin', 'ghamgeen hoon',
  'udass hoon', 'udass', 'udas hoon'
];

const isSelfReferentialText = (text: string): boolean => {
  const lower = text.toLowerCase();

  const firstPersonIndicators = [
    ' i ', 'i ', 'i\'', 'i am', 'i\'m', 'me ', 'my ', 'myself',
    'main ', 'mn ', 'mujhe', 'meri ', 'mera ', 'khud ko', 'apne aap',
  ];

  const thirdPersonIndicators = [
    'my friend', 'my brother', 'my sister', 'my mother', 'my father',
    'someone i know', 'a person i know', 'someone else',
    'he wants', 'she wants', 'they want', 'he said', 'she said', 'they said',
    'he told me', 'she told me', 'they told me', 'my neighbor', 'my relative',
    'a friend of mine', 'one of my friends',
  ];

  for (const phrase of thirdPersonIndicators) {
    if (lower.includes(phrase)) return false;
  }
  for (const phrase of firstPersonIndicators) {
    if (lower.includes(phrase)) return true;
  }
  return false;
};

export const checkContent = (text: string): { flagged: boolean; reason?: string } => {
  if (!isSelfReferentialText(text)) {
    return { flagged: false };
  }

  const lowerText = text.toLowerCase();
  
  for (const keyword of CONCERNING_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return {
        flagged: true,
        reason: `Contains concerning keyword: "${keyword}"`
      };
    }
  }
  
  return { flagged: false };
};

export default {
  checkContent
};