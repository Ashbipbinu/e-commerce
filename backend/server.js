import express from "express";
import dotenv from "dotenv";

import authRoutes from "./Routes/auth.route.js";
import productRoutes from "./Routes/product.route.js";
import cartRoutes from "./Routes/cart.route.js";
import couponsRoutes from './Routes/coupons.route.js'
import paymentRoutes from './Routes/payment.route.js'
import analyticsRoutes from './Routes/analytics.routes.js'


import { connectDB } from "./dbConfig/mongodb.js";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser())

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupon", couponsRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  connectDB();
  console.log(`Listening to PORT ${PORT}`);
});
