import type { RequestHandler } from 'express';
import type { MiddlewareHandler } from 'hono';

interface ExpressApp {
  // Express 4.x
  _router?: {
    stack: Array<{
      route?: {
        path: string;
        methods: Record<string, boolean>;
        stack: Array<{ handle?: Function }>;
      };
    }>;
  };
  // Express 5.x
  router?: {
    stack: Array<{
      route?: {
        path: string;
        methods: Record<string, boolean>;
        stack: Array<{ handle?: Function }>;
      };
    }>;
  };
  get(setting: string): unknown;
  set(setting: string, value: unknown): void;
  use: Function;
  listen: Function;
}

interface HonoApp {
  routes: Array<{
    method: string;
    path: string;
    handler?: Function;
  }>;
}

/**
 * AtomicDocs middleware for Express.js and Hono frameworks.
 * Auto-detects the framework and returns the appropriate middleware.
 * 
 * Compatible with Express 4.x and Express 5.x
 * 
 * @example
 * // Express.js usage
 * import express from 'express';
 * import atomicdocs from 'atomicdocs';
 * 
 * const app = express();
 * app.use(atomicdocs());
 * 
 * // Define your routes...
 * app.get('/users', (req, res) => res.json([]));
 * 
 * app.listen(3000, () => {
 *   atomicdocs.register(app, 3000);
 * });
 * 
 * @example
 * // Hono usage
 * import { Hono } from 'hono';
 * import atomicdocs from 'atomicdocs';
 * 
 * const app = new Hono();
 * app.use('*', atomicdocs(app, 3000));
 */
declare function atomicdocs(): RequestHandler;
declare function atomicdocs(app: HonoApp, port: number): MiddlewareHandler;

declare namespace atomicdocs {
  /**
   * Manually register Express routes with AtomicDocs.
   * Call this after all routes are defined.
   * 
   * Works with both Express 4.x and Express 5.x
   * 
   * @param app - Express application instance
   * @param port - Port number the server is running on
   * 
   * @example
   * import express from 'express';
   * import atomicdocs from 'atomicdocs';
   * 
   * const app = express();
   * const PORT = 3000;
   * 
   * app.use(atomicdocs());
   * 
   * // Define routes...
   * app.get('/users', (req, res) => res.json([]));
   * 
   * app.listen(PORT, () => {
   *   atomicdocs.register(app, PORT);
   * });
   */
  function register(app: ExpressApp | any, port: number): void;
}

export = atomicdocs;
