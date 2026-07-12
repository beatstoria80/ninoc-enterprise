const fs = require('fs');
let content = fs.readFileSync('src/components/GlobalHeader.tsx', 'utf8');

content = content.replace(/isDarkBg \? "text-white\/80 hover:text-white" : "text-ink\/50 hover:text-rose"/g, 'isDarkBg ? "text-white hover:text-white/80" : "text-ink hover:text-rose"');
content = content.replace(/isDarkBg \? "text-white\/80 hover:text-white" : "text-ink\/40 hover:text-rose"/g, 'isDarkBg ? "text-white hover:text-white/80" : "text-ink hover:text-rose"');
content = content.replace(/isDarkBg \? "text-white\/60 hover:text-white" : "text-ink\/40 hover:text-rose"/g, 'isDarkBg ? "text-white hover:text-white/80" : "text-ink hover:text-rose"');
content = content.replace(/isDarkBg \? "text-white\/80 group-hover:text-white" : "text-ink\/40 group-hover:text-rose"/g, 'isDarkBg ? "text-white group-hover:text-white/80" : "text-ink group-hover:text-rose"');
content = content.replace(/isDarkBg \? "text-white\/50 hover:text-white" : "text-ink\/20 hover:text-ink\/60"/g, 'isDarkBg ? "text-white/80 hover:text-white" : "text-ink/60 hover:text-ink"');
content = content.replace(/isDarkBg \? "text-white\/80 hover:text-white" : "text-ink\/60 hover:text-rose"/g, 'isDarkBg ? "text-white hover:text-white/80" : "text-ink hover:text-rose"');
content = content.replace(/className="text-ink\/30"/g, 'className="text-ink/50"');

fs.writeFileSync('src/components/GlobalHeader.tsx', content, 'utf8');
console.log('Contrast fixed');
