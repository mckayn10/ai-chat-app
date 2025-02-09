import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/users';
import contactRoutes from './routes/contacts';
import notificationRoutes from './routes/notifications';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Configure CORS to accept requests from any origin
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Listen on all network interfaces
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Server is accessible at http://localhost:${port}`);
  console.log(`For Expo Go, use http://YOUR_IP:${port}`);
}); 