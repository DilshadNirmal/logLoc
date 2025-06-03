const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { getUserNotifications } = require('../services/notificationService');
const auth = require('../middleware/auth');

// Get all notifications (user-specific and global)
router.get('/', auth, async (req, res) => {
    try {
      const notifications = await getUserNotifications(req.user._id);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Mark notification as read
  router.patch('/:id/read', auth, async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id },
        { read: true },
        { new: true }
      );
  
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
  
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Mark all as read
  router.patch('/read-all', auth, async (req, res) => {
    try {
      await Notification.updateMany(
        { user: req.user._id, read: false },
        { $set: { read: true } }
      );
  
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all as read:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

module.exports = router;