import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let goServer = null;
let serverReady = false;

function startGoServer() {
  if (goServer) return;
  
  const binaryName = process.platform === 'win32' ? 'atomicdocs-final-v2.exe' : 'atomicdocs-final-v2';
  const binaryPath = join(__dirname, '..', 'atomicdocs', 'bin', binaryName);
  
  goServer = spawn(binaryPath, [], { 
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  goServer.on('error', () => {});
  setTimeout(() => { serverReady = true; }, 500);
}

function extractHandlerCode(app) {
  const routes = [];
  
  // Access Hono's internal routes
  if (app.routes) {
    app.routes.forEach((route) => {
      let handlerCode = '';
      
      // Extract handler function code
      if (route.handler && typeof route.handler === 'function') {
        handlerCode = route.handler.toString();
      }
      
      routes.push({
        method: route.method.toUpperCase(),
        path: route.path,
        handler: handlerCode
      });
    });
  }
  
  return routes.filter(r => !r.path.startsWith('/docs'));
}

function registerRoutes(routes, port) {
  if (!serverReady) {
    setTimeout(() => registerRoutes(routes, port), 100);
    return;
  }
  
  console.log(`Sending ${routes.length} routes to Go server...`);
  
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
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('✓ Registered with AtomicDocs:', body);
    });
  });
  
  req.on('error', (err) => {
    console.error('✗ Failed to register:', err.message);
  });
  
  req.write(data);
  req.end();
}

export function atomicDocs(app, port) {
  startGoServer();
  
  setTimeout(() => {
    const routes = extractHandlerCode(app);
    registerRoutes(routes, port);
  }, 1000);
  
  return async (c, next) => {
    if (c.req.path === '/docs' || c.req.path === '/docs/json') {
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
