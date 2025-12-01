const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

let goServer = null;
let serverReady = false;

function getBinaryName() {
  const platform = process.platform;
  const arch = process.arch;
  
  const platformMap = {
    'win32': 'win',
    'darwin': 'darwin',
    'linux': 'linux'
  };
  
  const archMap = {
    'x64': 'x64',
    'arm64': 'arm64'
  };
  
  const mappedPlatform = platformMap[platform];
  const mappedArch = archMap[arch];
  
  if (!mappedPlatform || !mappedArch) {
    throw new Error(`Unsupported platform: ${platform}-${arch}`);
  }
  
  const ext = platform === 'win32' ? '.exe' : '';
  return `atomicdocs-${mappedPlatform}-${mappedArch}${ext}`;
}

function startGoServer() {
  if (goServer) return;
  
  const binaryName = getBinaryName();
  const binaryPath = path.join(__dirname, 'bin', binaryName);
  
  // Check if binary exists
  const fs = require('fs');
  if (!fs.existsSync(binaryPath)) {
    console.error(`✗ AtomicDocs: Binary not found at ${binaryPath}`);
    console.error('  Run "node install.js" in the atomicdocs package directory to download it.');
    return;
  }
  
  goServer = spawn(binaryPath, [], { 
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  goServer.on('error', (err) => {
    console.error('✗ AtomicDocs: Failed to start server:', err.message);
  });
  
  goServer.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`✗ AtomicDocs: Server exited with code ${code}`);
    }
    goServer = null;
    serverReady = false;
  });
  
  setTimeout(() => { serverReady = true; }, 500);
}

function isHono(app) {
  return app && app.routes && Array.isArray(app.routes);
}

function isExpress(app) {
  // Check for Express app characteristics
  return app && (
    typeof app.use === 'function' &&
    typeof app.get === 'function' &&
    typeof app.post === 'function' &&
    (app._router || app.router || app._routerStack)
  );
}

function extractExpressRoutes(app) {
  const routes = [];
  
  // Try to get router stack - handle different Express versions
  let stack = null;
  
  // Express 4.x
  if (app._router && app._router.stack) {
    stack = app._router.stack;
  }
  // Express 5.x - router is exposed differently
  else if (app.router && app.router.stack) {
    stack = app.router.stack;
  }
  // Fallback: try to access via app.get('router')
  else if (typeof app.get === 'function') {
    try {
      const router = app.get('router');
      if (router && router.stack) {
        stack = router.stack;
      }
    } catch (e) {}
  }
  
  if (!stack) {
    console.warn('AtomicDocs: Could not find Express router stack. Routes may not be detected.');
    return routes;
  }
  
  function extractFromStack(layerStack, basePath = '') {
    if (!layerStack || !Array.isArray(layerStack)) return;
    
    layerStack.forEach(layer => {
      if (!layer) return;
      
      // Direct route
      if (layer.route) {
        const routePath = layer.route.path;
        const handler = layer.route.stack && layer.route.stack[0] ? layer.route.stack[0].handle : null;
        const handlerCode = handler ? handler.toString() : '';
        
        // Get methods from route
        const methods = layer.route.methods || {};
        Object.keys(methods).forEach(method => {
          if (methods[method]) {
            routes.push({
              method: method.toUpperCase(),
              path: basePath + routePath,
              handler: handlerCode
            });
          }
        });
      }
      // Nested router (app.use('/prefix', router))
      else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        let routePath = '';
        
        // Extract path from regexp
        if (layer.regexp) {
          const regexpStr = layer.regexp.source || layer.regexp.toString();
          routePath = regexpStr
            .replace(/^\^/, '')
            .replace(/\\\/\?\(\?=\\\/\|\$\)$/, '')
            .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param')
            .replace(/\\\//g, '/')
            .replace(/\?(?:\=.*)?$/g, '');
        }
        
        // Handle Express 5 path property
        if (layer.path) {
          routePath = layer.path;
        }
        
        extractFromStack(layer.handle.stack, basePath + routePath);
      }
      // Mounted app (app.use('/prefix', anotherApp))
      else if (layer.name === 'mounted_app' && layer.handle && layer.handle._router) {
        let routePath = '';
        if (layer.regexp) {
          const regexpStr = layer.regexp.source || layer.regexp.toString();
          routePath = regexpStr
            .replace(/^\^/, '')
            .replace(/\\\/\?\(\?=\\\/\|\$\)$/, '')
            .replace(/\\\//g, '/');
        }
        extractFromStack(layer.handle._router.stack, basePath + routePath);
      }
    });
  }
  
  extractFromStack(stack);
  return routes.filter(r => !r.path.startsWith('/docs'));
}

function extractHonoRoutes(app) {
  return app.routes.map(route => ({
    method: route.method.toUpperCase(),
    path: route.path,
    handler: route.handler ? route.handler.toString() : ''
  })).filter(r => !r.path.startsWith('/docs'));
}

function registerRoutes(routes, port) {
  const data = JSON.stringify({ routes, port });
  
  const req = http.request({
    hostname: 'localhost',
    port: 6174,
    path: '/api/register',
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  });
  
  req.on('error', (err) => {
    // Silently ignore connection errors
  });
  
  req.write(data);
  req.end();
}

// Express middleware
function expressMiddleware() {
  startGoServer();
  
  return function(req, res, next) {
    if (req.path === '/docs' || req.path === '/docs/json') {
      const options = {
        hostname: 'localhost',
        port: 6174,
        path: req.path,
        method: 'GET',
        headers: { 'X-App-Port': req.app.get('port') || req.socket.localPort }
      };
      
      http.get(options, (goRes) => {
        res.writeHead(goRes.statusCode, goRes.headers);
        goRes.pipe(res);
      }).on('error', (err) => {
        res.status(503).send('AtomicDocs unavailable');
      });
      return;
    }
    
    next();
  };
}

// Hono middleware
function honoMiddleware(app, port) {
  startGoServer();
  
  setTimeout(() => {
    if (!serverReady) return;
    const routes = extractHonoRoutes(app);
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

// Auto-detect framework
module.exports = function(app, port) {
  if (isHono(app)) {
    return honoMiddleware(app, port);
  }
  return expressMiddleware();
};

// Express manual registration
module.exports.register = function(app, port) {
  if (!serverReady) {
    setTimeout(() => module.exports.register(app, port), 100);
    return;
  }
  
  try {
    const routes = extractExpressRoutes(app);
    if (routes.length > 0) {
      console.log(`✓ AtomicDocs: Registered ${routes.length} routes`);
    } else {
      console.warn('⚠ AtomicDocs: No routes found. Make sure routes are defined before calling register()');
    }
    registerRoutes(routes, port);
  } catch (err) {
    console.error('✗ AtomicDocs: Failed to extract routes:', err.message);
  }
};
