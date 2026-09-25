const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
const WEB_DIR = __dirname;

// Determine Local Wi-Fi IPv4 address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Prefer standard Wi-Fi or 10.x.x.x / 192.168.x.x
        if (iface.address.startsWith('10.') || iface.address.startsWith('192.168.')) {
          return iface.address;
        }
      }
    }
  }
  // Fallback to first non-internal IPv4
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIp = getLocalIpAddress();

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check route
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', localIp, port: PORT }));
    return;
  }

  // File resolution
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(WEB_DIR, reqPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(WEB_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for client-side routing
      const indexPath = path.join(WEB_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const mobileUrl = `http://${localIp}:${PORT}`;
  const desktopUrl = `http://localhost:${PORT}`;

  console.log('\n=============================================================');
  console.log('✨  AURA EXPENSE — MOBILE WEB APPLICATION RUNNING');
  console.log('=============================================================');
  console.log(`📱 Mobile Device URL:  ${mobileUrl}`);
  console.log(`💻 Desktop Preview:    ${desktopUrl}`);
  console.log('-------------------------------------------------------------');
  console.log('👉 To open on your mobile phone:');
  console.log(`   1. Ensure your phone is connected to the same Wi-Fi.`);
  console.log(`   2. Open browser on your phone and navigate to: ${mobileUrl}`);
  console.log(`   3. Or scan the QR code in the app by opening ${desktopUrl}`);
  console.log('   4. (Optional) In mobile Safari/Chrome, tap "Add to Home Screen"');
  console.log('=============================================================\n');
});
