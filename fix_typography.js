const fs = require('fs');
const files = [
  'src/components/ReturStatus.tsx',
  'src/app/profile/returns/ReturnsClient.tsx',
  'src/components/admin/tabs/ReturTab.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  
  content = content.replace(/md:text-\[7px\]/g, 'md:text-xs');
  content = content.replace(/md:text-\[8px\]/g, 'md:text-xs');
  content = content.replace(/md:text-\[9px\]/g, 'md:text-sm');
  content = content.replace(/md:text-\[10px\]/g, 'md:text-sm');
  content = content.replace(/md:text-\[11px\]/g, 'md:text-sm');
  
  content = content.replace(/text-\[7px\]/g, 'text-xs');
  content = content.replace(/text-\[8px\]/g, 'text-xs');
  content = content.replace(/text-\[9px\]/g, 'text-xs');
  content = content.replace(/text-\[10px\]/g, 'text-xs');
  content = content.replace(/text-\[11px\]/g, 'text-sm');
  
  content = content.replace(/text-xs md:text-xs/g, 'text-xs');
  content = content.replace(/text-sm md:text-sm/g, 'text-sm');
  content = content.replace(/text-xs md:text-sm/g, 'text-xs md:text-sm');
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
