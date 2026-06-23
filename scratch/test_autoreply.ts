import { classifyMessage, getResponse, stripGreeting } from '../src/lib/supportAutoReply';

const testCases = [
  {
    desc: 'Exact keyword match',
    message: 'dimana alamat ninoc',
    isFirst: true
  },
  {
    desc: 'Typo handling (laca instead of lacak)',
    message: 'min tolong laca pesanan saya NCO-12345',
    isFirst: true
  },
  {
    desc: 'First reply with greeting',
    message: 'min tolong lacak pesanan saya',
    isFirst: true
  },
  {
    desc: 'Subsequent reply without greeting',
    message: 'stuck di jakarta utara',
    isFirst: false
  },
  {
    desc: 'Capitalization check',
    message: 'SAYA MAU BATALKAN PESANAN',
    isFirst: true
  },
  {
    desc: 'Overpaid/Refund',
    message: 'saya kelebihan transfer nih min 50rb',
    isFirst: false
  },
  {
    desc: 'Unknown general query',
    message: 'halo admin',
    isFirst: true
  }
];

console.log('--- STARTING AUTOREPLY QA & DEBUG ---\n');

testCases.forEach((tc, idx) => {
  const classified = classifyMessage(tc.message);
  const response = getResponse(classified.category, tc.message, tc.isFirst);
  
  console.log(`[TEST ${idx + 1}: ${tc.desc}]`);
  console.log(`User: "${tc.message}"`);
  console.log(`Matched Category: ${classified.category} (Score: ${classified.score})`);
  console.log(`Keywords matched: ${classified.matchedKeywords.join(', ')}`);
  console.log(`Is First Reply: ${tc.isFirst}`);
  console.log(`\nBOT RESPONSE:\n${response}`);
  console.log('\n----------------------------------------\n');
});
