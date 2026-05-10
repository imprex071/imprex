const fs = require('fs');
const path = require('path');

function cleanCyan(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/cyan-400/g, 'zinc-300');
  fs.writeFileSync(filePath, content);
  console.log('Cleaned ' + filePath);
}

cleanCyan(path.join(__dirname, 'components/Terminal.tsx'));
