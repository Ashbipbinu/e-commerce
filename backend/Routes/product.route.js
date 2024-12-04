import express from "express";
import {
  getAllProducts,
  getFeaturedProducts,
  createProduct,
  deleteProduct,
  getRecommendation,
  getProductsByCategory,
  toggleFeatureProduct
} from "../Controllers/product.controller.js";
import { protectRoute, adminRoute } from "../Middleware/auth.middle.js";

const route = express.Router();

route.get("/", protectRoute, adminRoute, getAllProducts);
route.get("/featured", getFeaturedProducts);
route.get("/category/:category", getProductsByCategory);
route.get("/recommendation", getRecommendation);
route.post("/", protectRoute, adminRoute, createProduct);
route.delete("/:id", protectRoute, adminRoute, deleteProduct);
route.patch("/:id", protectRoute, adminRoute, toggleFeatureProduct);

export default route;
