import express from 'express';
import { protectRoute } from '../Middleware/auth.middle.js';
import { getCoupon, validateCode } from '../Controllers/coupons.controller.js';

const route = express.Router()

route.get('/', protectRoute, getCoupon)

//cahnge the below to get if post no working
route.post('/:code', protectRoute, validateCode)

export default route
