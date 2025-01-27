import mongoose from 'mongoose';

const playerBetSchema = mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to User model
  betOnSeven: { type: Boolean, required: true },
  result: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const PlayerBet = mongoose.model('PlayerBet', playerBetSchema);

export default PlayerBet;
