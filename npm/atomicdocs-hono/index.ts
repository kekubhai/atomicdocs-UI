import type { MiddlewareHandler } from 'hono';

export function atomicDocs(app: any, port: number): MiddlewareHandler {
  let registered = false;
  
  // Register routes on first request
  setTimeout(() => {
    if (registered) return;
    
    const routes = app.routes.map((route: any) => ({
      method: route.method.toUpperCase(),
      path: route.path,
      handler: ''
    }));
    
    fetch('http://localhost:6174/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routes, port })
    }).then(() => {
      console.log(`✓ Registered ${routes.length} routes with AtomicDocs`);
    }).catch(() => {});
    
    registered = true;
  }, 1000);
  
  return async (c, next) => {
    if (c.req.path === '/docs' || c.req.path === '/docs/json') {
      const response = await fetch(`http://localhost:6174${c.req.path}`, {
        headers: { 'X-App-Port': port.toString() }
      });
      
      const contentType = response.headers.get('content-type');
      const body = await response.text();
      
      return new Response(body, {
        status: response.status,
        headers: { 'Content-Type': contentType || 'text/html' }
      });
    }
    
    await next();
  };
}
