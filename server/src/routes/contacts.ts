import { Router, Response } from 'express';
import { ContactModel, ContactInput } from '../models/Contact';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all contacts for the current user
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const contacts = await ContactModel.findByUserId(req.user!.id);
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Create a new contact
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const contactData: ContactInput = {
      ...req.body,
      userId: req.user!.id
    };

    // Validate required fields
    if (!contactData.firstName || !contactData.lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    // Validate email format if provided
    if (contactData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactData.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    const contact = await ContactModel.create(contactData);
    res.status(201).json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to create contact'
    });
  }
});

// Update a contact
router.put('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const contactId = parseInt(req.params.id);
    if (isNaN(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    const updates = req.body;
    const contact = await ContactModel.update(req.user!.id, contactId, updates);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(400).json({ error: 'Failed to update contact' });
  }
});

// Delete a contact
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const contactId = parseInt(req.params.id);
    if (isNaN(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    const success = await ContactModel.delete(req.user!.id, contactId);
    if (success) {
      res.json({ message: 'Contact deleted successfully' });
    } else {
      res.status(404).json({ error: 'Contact not found' });
    }
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router; 