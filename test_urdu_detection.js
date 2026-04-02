// Test Urdu Suicide Detection
import { checkContent } from './utils/contentMonitor.ts';
import { enhancedCheckContent } from './utils/enhancedSuicideDetection.ts';

// Test Urdu keywords
const testTexts = [
  "khudkushi karna chahti hoon",
  "jaan lena chahta hoon",
  "zindagi se tang aa gayi hoon",
  "main marne ka faisla kar chuki hoon",
  "dard khatam karna chahti hoon",
  "sab kuch khatam kar doon",
  "normal text without issues"
];

console.log("Testing Urdu Suicide Detection:");
console.log("=================================");

testTexts.forEach((text, index) => {
  console.log(`\nTest ${index + 1}: "${text}"`);

  // Basic content monitor
  const basicResult = checkContent(text);
  console.log(`Basic Monitor: ${basicResult.flagged ? 'FLAGGED' : 'SAFE'} ${basicResult.reason ? `(${basicResult.reason})` : ''}`);

  // Enhanced detection (async)
  enhancedCheckContent(text).then(enhancedResult => {
    console.log(`Enhanced Detection: ${enhancedResult.riskLevel.toUpperCase()} (${(enhancedResult.confidence * 100).toFixed(1)}% confidence)`);
    if (enhancedResult.riskFactors.length > 0) {
      console.log(`Risk Factors: ${enhancedResult.riskFactors.slice(0, 2).join(', ')}`);
    }
  });
});