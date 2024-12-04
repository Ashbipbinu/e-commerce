import express from 'express';
import { protectRoute } from '../Middleware/auth.middle.js';
import { checkOutSuccess, createCheckoutSession } from '../Controllers/payment.controller.js';

const route = express.Router();

route.post('/create-checkout-session', protectRoute, createCheckoutSession)
route.post('/checkout-success', protectRoute, checkOutSuccess)


export default route;