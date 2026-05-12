const fs = require("fs");
const parser = require("@babel/parser");
const code = fs.readFileSync("src/app/components/AdminDashboardPage.tsx", "utf8");
try {
  parser.parse(code, { sourceType: "module", plugins: ["jsx", "typescript", "classProperties", "decorators-legacy"] });
  console.log("PARSE OK");
} catch (e) {
  console.error("PARSE ERROR");
  console.error(e.message);
  console.error(e.loc);
  process.exit(1);
}
