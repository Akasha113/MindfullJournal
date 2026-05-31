import { enhancedCheckContent, isInformationalQuery, isAboutSelf } from '../src/utils/enhancedSuicideDetection';

const samples = [
  'Is suicide good or bad?',
  'I have pills and I plan to use them tonight',
  'I feel so alone and empty',
  'I was cutting vegetables on the bridge',
  'My friend said they want to die',
];

(async () => {
  for (const s of samples) {
    try {
      const info = isInformationalQuery(s);
      const aboutSelf = isAboutSelf(s);
      const analysis = await enhancedCheckContent(s);
      console.log('---');
      console.log('Message:', s);
      console.log('isInformationalQuery:', info);
      console.log('isAboutSelf:', aboutSelf);
      console.log('Risk level:', analysis.riskLevel, 'Confidence:', analysis.confidence?.toFixed?.(2));
      console.log('Risk factors:', analysis.riskFactors);
      console.log('Contextual cues:', analysis.contextualCues);
      console.log('Recommended action:', analysis.recommendedAction);
    } catch (err) {
      console.error('Error analyzing message:', s, err);
    }
  }
})();
