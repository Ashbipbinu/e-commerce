import User from "../Model/user.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../dbConfig/redisdb.js";

const generateToken = async (userId) => {
  const accessToken = await jwt.sign({ userId }, process.env.SECRET_KEY, {
    expiresIn: "15m",
  });
  const refreshToken = await jwt.sign(
    { userId },
    process.env.REFRESH_SECRET_KEY,
    {
      expiresIn: "7d",
    }
  );
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userID, refreshToken) => {
  // await redis.set(
  //   `refreshToken:${userID}`,
  //    refreshToken,
  //   "EX",
  //   7 * 24 * 60 * 60
  // ); //7days
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("access_token", accessToken, {
    httpOnly: true, //Prevent XSS attacks
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", //prevents CSRF attack
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true, //Prevent XSS attacks
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", //prevents CSRF attack
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const isUserExists = await User.findOne({ email });

    if (isUserExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ email, password, name });
    const { accessToken, refreshToken } = await generateToken(user._id);
    await storeRefreshToken(user._id, refreshToken);

    setCookies(res, accessToken, refreshToken);

    return res.status(201).json({ user, message: "User created successfully" });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const { refreshToken, accessToken } = await generateToken(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      return res.json(user);
    }

    return res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Error while logging in", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = await jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET_KEY
      );
      await redis.del(`refreshToken:${decoded.userId}`);
    }
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(400).json({ message: "Server error", error: error.message });
    next(error.message);
  }
};

// Refresh the access token if it is expired, using refresh token
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return res.status(404).json({ message: "refresh token not found" });
    }
    const decode = await jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET_KEY
    );
    const storedToken = await redis.get(`refreshToken:${decode.userId}`);

    if (refreshToken !== storedToken) {
      return res.status(401).json({ message: "Tokens not matching" });
    }

    const accessToken = jwt.sign(
      { userId: decode.userId },
      process.env.SECRET_KEY,
      { expiresIn: "15m" }
    );
    res.cookie("access_token", accessToken, {
      http: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: "Token refreshed successfully" });
  } catch (error) {
    res
      .status(400)
      .json({
        message: "Something went wrong with token refres",
        error: error.message,
      });
  }
};
