const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'controllers', 'medSmartController.js');
let code = fs.readFileSync(filePath, 'utf8');

// Replace function signatures
code = code.replace(/async\s*\(\s*req,\s*res\s*\)\s*=>/g, 'async (req, res, next) =>');

// Replace catch blocks. Note the explicit regex to catch the res.status(500).json format
code = code.replace(/catch\s*\(\s*error\s*\)\s*\{\s*res\.status\(500\)\.json\(\{\s*message:\s*error\.message\s*\}\);\s*\}/g, 'catch (error) {\n        next(error);\n    }');

fs.writeFileSync(filePath, code, 'utf8');
console.log('medSmartController refactored');
