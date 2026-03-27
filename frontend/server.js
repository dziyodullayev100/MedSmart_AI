/**
 * frontend/server.js
 * A simple Node.js server to serve the MedSmart frontend with "Clean URL" support.
 * Maps /bemor_login -> bemor_login.html automatically.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
    
    // Remove query params or hashes
    filePath = filePath.split('?')[0].split('#')[0];

    // Helper to serve file
    const serveFile = (targetPath, contentType) => {
        fs.readFile(targetPath, (error, content) => {
            if (error) {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    };

    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) {
            // 1. Exact file found
            const ext = String(path.extname(filePath)).toLowerCase();
            serveFile(filePath, MIME_TYPES[ext] || 'application/octet-stream');
        } else if (!err && stats.isDirectory()) {
            // 2. Directory found, check for index.html
            const indexFile = path.join(filePath, 'index.html');
            if (fs.existsSync(indexFile)) {
                serveFile(indexFile, 'text/html');
            } else {
                res.writeHead(404);
                res.end('404 Not Found (Directory index missing)');
            }
        } else {
            // 3. File not found, try appending .html (Clean URLs)
            const htmlPath = filePath + '.html';
            if (fs.existsSync(htmlPath)) {
                serveFile(htmlPath, 'text/html');
            } else {
                // 4. Truly not found
                res.writeHead(404);
                res.end('404 Not Found: ' + req.url);
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`\x1b[33m%s\x1b[0m`, `🚀 MedSmart Frontend running on http://localhost:${PORT}`);
    console.log(`\x1b[32m%s\x1b[0m`, `✅ Support for Clean URLs enabled (/login -> /login.html)`);
});
