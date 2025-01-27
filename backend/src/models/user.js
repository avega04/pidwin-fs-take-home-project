import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  id: { type: String },
  winStreak: { type: Number, default: 0 } // New field to track winning streaks
});

export default mongoose.model("User", userSchema);