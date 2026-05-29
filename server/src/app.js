import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import faqRoutes from './routes/faq.routes.js';
import rtqRoutes from './routes/rtq.routes.js';
import questionRoutes from './routes/question.routes.js';
import userRoutes from './routes/user.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import ragRoutes from './routes/rag.routes.js';
import qpRoutes from './routes/qp.routes.js';
import categoryUpvoteRoutes from './routes/categoryUpvote.routes.js';
import vectorRoutes from './routes/vector.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

// Middleware
app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/faq/categories', categoryUpvoteRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/rtq', rtqRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/qp', qpRoutes);
app.use('/api/vector', vectorRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

export default app;