// Waar de tests op draaien.
//   In een app:      de map van de app zelf.
//   In de template:  een ingevulde kopie in .test-build (gemaakt door tests/start-server.mjs
//                    met tools/vul-in.mjs), want de template zelf bevat placeholders.
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const IS_TEMPLATE = fs.existsSync(path.join(REPO, '.template'));
const ROOT = IS_TEMPLATE ? path.join(REPO, '.test-build') : REPO;
const PORT = Number(process.env.TEST_PORT || 5610);

module.exports = { REPO, ROOT, IS_TEMPLATE, PORT, BASE: `http://localhost:${PORT}/` };
