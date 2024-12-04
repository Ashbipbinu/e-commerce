import express from "express";
import {
  addToCart,
  getCartProducts,
  updateQuantity,
  removeAllProduct,
} from "../Controllers/cart.controller.js";
import { protectRoute } from "../Middleware/auth.middle.js";

const route = express.Router();

route.get("/", protectRoute, getCartProducts);
route.post("/", protectRoute, addToCart);
route.put("/:id", protectRoute, updateQuantity);
route.delete("/", protectRoute, removeAllProduct);

export default route;
