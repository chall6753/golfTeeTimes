import express from 'express';
import subscriptionController from '../controllers/subscriptionController.js';

const router = express.Router();

// POST /subscribe
router.post('/subscribe', subscriptionController.subscribe);


router.get('/subscriptions/:userId', subscriptionController.getByUser);


export default router;
