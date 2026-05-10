const fs = require('fs');
const path = require('path');

function fixColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/text-red-400/g, 'text-red-600');
  content = content.replace(/text-emerald-400/g, 'text-emerald-600');
  content = content.replace(/text-yellow-400/g, 'text-yellow-600');
  content = content.replace(/text-blue-400/g, 'text-blue-600');
  content = content.replace(/text-cyan-400/g, 'text-cyan-600');
  content = content.replace(/border-red-500\/20/g, 'border-red-500/30');
  content = content.replace(/border-emerald-500\/20/g, 'border-emerald-500/30');
  fs.writeFileSync(filePath, content);
  console.log('Fixed colors ' + filePath);
}

fixColors(path.join(__dirname, 'components/Terminal.tsx'));
fixColors(path.join(__dirname, 'components/TerminalLogin.tsx'));
