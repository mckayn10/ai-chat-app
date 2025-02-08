import { Router, Request, Response } from 'express';
import { UserModel, UserInput } from '../models/User';
import { auth, AuthRequest } from '../middleware/auth';
import jwt from 'jsonwebtoken';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const userData: UserInput = req.body;
    
    // Validate required fields
    if (!userData.email || !userData.firstName || !userData.lastName || !userData.password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existingUser = await UserModel.findByEmail(userData.email);

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await UserModel.create(userData);
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to create user',
      details: error
    });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await UserModel.verifyPassword(email, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findByEmail(req.user!.email);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Get all users
router.get('/', auth, async (_req: Request, res: Response) => {
  try {
    const users = await UserModel.list();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Delete user
router.delete('/:email', auth, async (req: Request, res: Response) => {
  try {
    const success = await UserModel.delete(req.params.email);
    if (success) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router; 