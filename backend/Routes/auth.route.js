import express from "express";
import { login, logout, signup, refreshToken } from "../Controllers/auth.controller.js";

const route = express.Router();

route.post("/signup", signup);
route.post("/login", login);
route.post("/logout", logout);
route.post("/refresh-token", refreshToken)

export default route;
