const { spawn } = require('child_process');
const path = require('path');

let goServer = null;
let serverReady = false;

function startGoServer() {
  if (goServer) return;
  
  const binaryName = process.platform === 'win32' ? 'atomicdocs-final.exe' : 'atomicdocs-final';
  const binaryPath = path.join(__dirname, '..', 'atomicdocs', 'bin', binaryName);
  
  goServer = spawn(binaryPath, [], { 
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  goServer.on('error', () => {});
  setTimeout(() => { serverReady = true; }, 500);
}

function registerRoutes(routes, port) {
  if (!serverReady) {
    setTimeout(() => registerRoutes(routes, port), 100);
    return;
  }
  
  const http = require('http');
  const data = JSON.stringify({ routes, port });
  const req = http.request({
    hostname: 'localhost',
    port: 6174,
    path: '/api/register',
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  });
  
  req.on('error', () => {});
  req.write(data);
  req.end();
}

module.exports = {
  atomicDocs: function(app, port) {
    startGoServer();
    
    setTimeout(() => {
      const routes = app.routes.map((route) => ({
        method: route.method.toUpperCase(),
        path: route.path,
        handler: ''
      })).filter((r) => !r.path.startsWith('/docs'));
      
      registerRoutes(routes, port);
      console.log(`✓ Registered ${routes.length} routes with AtomicDocs`);
    }, 1000);
    
    return async (c, next) => {
      if (c.req.path === '/docs' || c.req.path === '/docs/json') {
        const http = require('http');
        
        return new Promise((resolve) => {
          http.get({
            hostname: 'localhost',
            port: 6174,
            path: c.req.path,
            headers: { 'X-App-Port': port.toString() }
          }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
              const contentType = res.headers['content-type'] || 'text/html';
              resolve(new Response(body, {
                status: res.statusCode,
                headers: { 'Content-Type': contentType }
              }));
            });
          }).on('error', () => {
            resolve(c.text('AtomicDocs unavailable', 503));
          });
        });
      }
      
      await next();
    };
  }
};
