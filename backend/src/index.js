import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './routes/auth/index.js';
import publicRoutes from './routes/public/index.js';
import adminRoutes from './routes/admin/index.js';
import collegesRoutes from './routes/colleges/index.js';
import studentRoutes from './routes/student/index.js';
import counselorRoutes from './routes/counselor/index.js';
import superadminRoutes from './routes/superadmin/index.js';
import { sendError } from './utils/responseUtils.js';
import { verifySmtp } from './utils/emailUtils.js';

dotenv.config();

const app = express();

// ─── Security headers ────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────
// Support comma-separated list in FRONTEND_URL for multiple origins
// e.g. FRONTEND_URL=https://www.indiancareerguidancecouncil.com,https://icgc.up.railway.app
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  })
);

// ─── Body parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/colleges', collegesRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/counselor', counselorRoutes);
app.use('/api/v1/superadmin', superadminRoutes);

// Placeholder route index (expand per phase)
app.get('/api/v1', (_req, res) => {
  res.json({
    success: true,
    message: 'College Admission Prediction API v1',
    version: '1.0.0',
  });
});

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
});

// ─── Global error handler ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  sendError(res, 'Internal server error', 500, err.message);
});

// ─── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  verifySmtp(); // logs ✓ or ✗ so you know immediately if email will work
});

export default app;
