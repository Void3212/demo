const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('src/app/components/AdminDashboardPage.tsx', 'utf8');
const sourceFile = ts.createSourceFile('AdminDashboardPage.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, code, undefined, ts.ScriptKind.TSX);
let token = scanner.scan();
while (token !== ts.SyntaxKind.EndOfFileToken) {
  const pos = scanner.getTextPos() - 1;
  const loc = sourceFile.getLineAndCharacterOfPosition(pos);
  if (loc.line + 1 >= 850 && loc.line + 1 <= 885) {
    console.log(`${loc.line + 1}:${loc.character + 1} ${ts.SyntaxKind[token]} '${scanner.getTokenText()}'`);
  }
  token = scanner.scan();
}
