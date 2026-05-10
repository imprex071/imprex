const fs = require('fs');
const path = require('path');

function cleanShadow(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/shadow-\[0_0_30px_rgba\(6,182,212,0\.3\)\]/g, 'shadow-none');
  content = content.replace(/hover:bg-white text-black\/10/g, 'hover:bg-white/10 hover:text-white');
  fs.writeFileSync(filePath, content);
  console.log('Cleaned shadow ' + filePath);
}

cleanShadow(path.join(__dirname, 'components/Terminal.tsx'));
