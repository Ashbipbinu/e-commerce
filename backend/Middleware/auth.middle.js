import jwt  from "jsonwebtoken";
import User from "../Model/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {

    const accessToken = req.cookies.access_token;

    if (!accessToken) {
      return res
        .status(404)
        .json({ message: "Unauthorized - Access token not found" });
    }

    try {
      const decode = await jwt.verify(accessToken, process.env.SECRET_KEY);
      const userId = decode.userId;
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Unauthorized - Access token expired" });
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({
      message: "Error happend in protect route middleware",
      error: error.message,
    });
  }
};

export const adminRoute = (req, res, next) => {
  try {
    const user = req.user;
    if (user && user.role === "admin") {
      next();
    } else {
      res.status(403).json({
        message: "Access Denied - Admin only",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error happend in admin route middleware",
      error: error.message,
    });
  }
};
