import express from "express";
import login from "./user-login.js";
import signup from "./user-signup.js";
import changePassword from "./user-change-password.js";
import auth from "../utils/auth.js";
import User from '../models/user.js';

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/changePassword", auth, changePassword);

// Endpoint to retrieve the top 10 longest winning streaks
router.get('/top-streaks', async (req, res) => {
  try {
    const topStreaks = await User.find().sort({ winStreak: -1 }).limit(10).select('name winStreak');
    res.status(200).json(topStreaks);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving top streaks', error });
  }
});

export default router;
