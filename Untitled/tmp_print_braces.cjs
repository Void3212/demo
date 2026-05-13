const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('src/app/components/AdminDashboardPage.tsx', 'utf8');
const sourceFile = ts.createSourceFile('AdminDashboardPage.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, code, undefined, ts.ScriptKind.TSX);
let token = scanner.scan();
let count = 0;
while (token !== ts.SyntaxKind.EndOfFileToken) {
  if (token === ts.SyntaxKind.OpenBraceToken || token === ts.SyntaxKind.CloseBraceToken) {
    const pos = scanner.getTextPos() - scanner.getTokenText().length;
    const loc = sourceFile.getLineAndCharacterOfPosition(pos);
    console.log(`${loc.line + 1}:${loc.character + 1} ${ts.SyntaxKind[token]} '${scanner.getTokenText()}'`);
    count++;
  }
  token = scanner.scan();
  if (count > 2000) break;
}
