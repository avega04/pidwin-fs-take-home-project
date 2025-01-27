import React, { useState, useEffect } from "react";
import { Container, Grow, Paper, Typography, Button } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import { placeBet } from "../../api"; // Import the placeBet function
import io from "socket.io-client"; // Import Socket.IO client

const socket = io("http://localhost:5002"); // Connect to the Socket.IO server
socket.on("connect", () => {
  console.log("Connected to server");
});
const Home = () => {
  const [betMessage, setBetMessage] = useState(""); // State to store the bet message
  const [bettingDisabled, setBettingDisabled] = useState(false); // State to disable bet buttons

  const user = localStorage.getItem("profile")
    ? jwtDecode(JSON.parse(localStorage.getItem("profile")).token)
    : "null";
  const isSingedIn = user;

  useEffect(() => {
    if (isSingedIn !== "null" && isSingedIn !== null) {
      socket.emit("joinRoom", user._id); // Join the Socket.IO room with the user's ID

      socket.on("betResult", (data) => {
        setBetMessage(`You have ${data.result} the bet!`); // Display the bet result
        setBettingDisabled(false); // Enable bet buttons
      });

      return () => {
        socket.emit("leaveRoom", user._id);
        socket.off("betResult"); // Clean up the event listener on component unmount
      };
    }
  }, [isSingedIn, user]);

  const handlePlaceBet = async (e, betOnSeven) => {
    e.preventDefault();
    setBettingDisabled(true); // Disable bet buttons
    try {
      setBetMessage("Placing bet..."); // Set loading message
      const response = await placeBet({
        betOnSeven // Pass the betOnSeven value
      });
      setBetMessage(response.data.message); // Set the bet message
    } catch (error) {
      console.error("Error placing bet:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setBetMessage(`Error placing bet: ${error.response.data.message}`);
      } else
          setBetMessage("Error placing bet"); // Set error message
      setBettingDisabled(false); // Enable bet buttons in case of error
    }
  };

  return (
    <Grow in>
      <Container component="main" maxWidth="sm">
        <Paper elevation={3}>
          {isSingedIn !== "null" && isSingedIn !== null ? (
            <>
              <Typography variant="h4" align="center" color="primary">
                {`Welcome ${user.name}`}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={(e) => handlePlaceBet(e, true)}
                disabled={bettingDisabled} // Disable button based on state
              >
                Place Bet on Seven
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={(e) => handlePlaceBet(e, false)}
                disabled={bettingDisabled} // Disable button based on state
              >
                Place Bet Not on Seven
              </Button>
              {betMessage && (
                <Typography variant="body1" align="center" color="secondary">
                  {betMessage}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="h4" align="center" color="primary">
              Login to Play
            </Typography>
          )}
        </Paper>
      </Container>
    </Grow>
  );
};

export default Home;
