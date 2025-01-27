import express from 'express';
import Lucky7Game from '../models/Lucky7Game.js';
import PlayerBet from '../models/PlayerBet.js';
import User from '../models/user.js';
import mongoose from 'mongoose'; // Import mongoose to use ObjectId
import { Server } from 'socket.io'; // Import Socket.IO
import jwt from 'jsonwebtoken'; // Import jwt to decode token

const router = express.Router();

let bets = [];
let lastRollTime = Date.now();

// Initialize Socket.IO
const io = new Server(5002, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
io.on("connection", (socket) => {
    console.log("A client has connected");
    socket.on("joinRoom", (room) => {
        socket.join(room);
        console.log("Client joined room", room);
    });
    socket.on("disconnect", () => {
      console.log("A client has disconnected");
    });
});
// Endpoint to place a bet
router.post('/bet', async (req, res) => {
  const { betOnSeven } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing.' });
  }

  let userId;
  try {
    const decoded = jwt.verify(token, 'test'); // Verify the token
    userId = decoded._id;
    console.log("Decoded user ID:", userId);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }

  const timeSinceLastRoll = Date.now() - lastRollTime;
  if (typeof betOnSeven !== 'boolean' || !userId) {
    return res.status(400).json({ message: 'Invalid bet. Please provide a valid token and bet on true or false.' });
  }
  if (timeSinceLastRoll >= 10000) {
    return res.status(400).json({ message: 'Bets are not allowed within 5 seconds of the next roll.' });
  }

  // Check if userId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }

  // Check if user exists in the database
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  bets.push({ userId, betOnSeven });
  res.status(200).json({ message: 'Bet placed successfully. Waiting on Results...' });
});

// Function to simulate rolling of 2 dice
async function rollDice() {
  lastRollTime = Date.now();
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const sum = die1 + die2;
  const isLucky7 = sum === 7;
  console.log(`Rolled: ${die1} + ${die2} = ${sum}`);
  if (isLucky7) {
    console.log("Lucky 7!");
  }

  // Store the game outcome in the database
  const game = new Lucky7Game({ die1, die2, sum, isLucky7 });
  try {
    await game.save();
    console.log("Game outcome saved to database");
  } catch (error) {
    console.error("Error saving game outcome:", error);
  }

  // Check the bets and store results
  for (const bet of bets) {
    const betResult = bet.betOnSeven === isLucky7 ? 'won' : 'lost';
    console.log(`User ${bet.userId} bet ${betResult}!`);

    // Update the user's win streak
    const user = await User.findById(bet.userId);
    if (betResult === 'won') {
      user.winStreak += 1;
    } else {
      user.winStreak = 0;
    }
    await user.save();

    const playerBet = new PlayerBet({ player: bet.userId, betOnSeven: bet.betOnSeven, result: betResult });
    try {
      await playerBet.save();
      console.log("Player bet result saved to database");
    } catch (error) {
      console.error("Error saving player bet result:", error);
    }

    // Notify the player of the bet result
    io.to(bet.userId).emit('betResult', { result: betResult }); // Notify the player in their room
    console.log("Notified bet result to player", bet.userId, betResult);
  }
  bets = []; // Reset the bets
}

// Execute the rollDice function every 15 seconds
setInterval(rollDice, 15000);

export default router;
