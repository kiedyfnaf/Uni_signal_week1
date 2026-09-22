import express from 'express';
import path from 'path';
import { createInMemoryD1 } from './d1-db.js';

import * as loginHandler from './functions/api/auth/login.js';
import * as logoutHandler from './functions/api/auth/logout.js';
import * as meHandler from './functions/api/auth/me.js';
import * as registerHandler from './functions/api/auth/register.js';
import * as mangaIndexHandler from './functions/api/manga/index.js';
import * as mangaDetailHandler from './functions/api/manga/[id].js';
import * as mangaViewedHandler from './functions/api/manga/[id]/viewed.js';

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const db = await createInMemoryD1();

async function dispatch(handler, req, res, params = {}) {
  try {
    const fullUrl = `${req.protocol}://${req.get('host') || 'localhost:3000'}${req.originalUrl}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    const init = {
      method: req.method,
      headers,
    };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
      init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const webRequest = new Request(fullUrl, init);
    const context = {
      request: webRequest,
      env: {
        DB: db,
        ADMIN_USERNAMES: process.env.ADMIN_USERNAMES || 'admin,lucia',
        SESSION_DAYS: process.env.SESSION_DAYS || '30',
      },
      params,
    };

    const response = await handler(context);
    res.status(response.status);

    if (typeof response.headers.getSetCookie === 'function') {
      const cookies = response.headers.getSetCookie();
      if (cookies.length > 0) {
        res.setHeader('Set-Cookie', cookies);
      }
    } else if (response.headers.get('set-cookie')) {
      res.setHeader('Set-Cookie', response.headers.get('set-cookie'));
    }

    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() !== 'set-cookie') {
        res.setHeader(key, value);
      }
    }

    const body = await response.text();
    res.send(body);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

// API Routes
app.get('/api/auth/me', (req, res) => dispatch(meHandler.onRequestGet, req, res));
app.post('/api/auth/register', (req, res) => dispatch(registerHandler.onRequestPost, req, res));
app.post('/api/auth/login', (req, res) => dispatch(loginHandler.onRequestPost, req, res));
app.post('/api/auth/logout', (req, res) => dispatch(logoutHandler.onRequestPost, req, res));

app.get('/api/manga', (req, res) => dispatch(mangaIndexHandler.onRequestGet, req, res));
app.post('/api/manga', (req, res) => dispatch(mangaIndexHandler.onRequestPost, req, res));
app.get('/api/manga/:id', (req, res) => dispatch(mangaDetailHandler.onRequestGet, req, res, { id: req.params.id }));
app.post('/api/manga/:id/viewed', (req, res) => dispatch(mangaViewedHandler.onRequestPost, req, res, { id: req.params.id }));

// Clean URLs
app.get('/login', (req, res) => res.sendFile(path.join(process.cwd(), 'login.html')));
app.get('/filters', (req, res) => res.sendFile(path.join(process.cwd(), 'filters.html')));
app.get('/drafts', (req, res) => res.sendFile(path.join(process.cwd(), 'drafts.html')));
app.get('/history', (req, res) => res.sendFile(path.join(process.cwd(), 'history.html')));
app.get('/manga-editor', (req, res) => res.sendFile(path.join(process.cwd(), 'manga-editor.html')));
app.get('/manga-view', (req, res) => res.sendFile(path.join(process.cwd(), 'manga-view.html')));

// Static asset serving
app.use(express.static(process.cwd()));

// SPA fallback for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
