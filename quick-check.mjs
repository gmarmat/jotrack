import {scoreAnswer} from './src/interview-coach/scoring/rules.ts';

const ans = "At my company, I led a team that improved performance by 30%. We achieved great results.";
try {
  const res = scoreAnswer({answer: ans, persona: 'hiring-manager'});
  console.log('Success:', res);
} catch (e) {
  console.log('Error:', e.message);
}
