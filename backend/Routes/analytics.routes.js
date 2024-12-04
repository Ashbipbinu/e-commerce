import express from 'express';
import { adminRoute, protectRoute } from '../Middleware/auth.middle.js';
import { getAnalytics } from '../Controllers/analytics.controller.js';

const route = express.Router();

route.get('/', protectRoute, adminRoute, getAnalytics)

export default route
