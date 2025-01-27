import mongoose from 'mongoose';

const lucky7GameSchema = mongoose.Schema({
  die1: { type: Number, required: true },
  die2: { type: Number, required: true },
  sum: { type: Number, required: true },
  isLucky7: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Lucky7Game = mongoose.model('Lucky7Game', lucky7GameSchema);

export default Lucky7Game;
