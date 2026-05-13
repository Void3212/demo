const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('src/app/components/AdminDashboardPage.tsx', 'utf8');
try {
  parser.parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  console.log('parsed ok');
} catch (err) {
  console.error(err.message);
  console.error('loc', err.loc);
  console.error('pos', err.pos);
}
