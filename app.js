// Import Express.js
const express = require("express");
const axios = require("axios"); // for making API calls

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port, verify_token and page_access_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const accessToken = process.env.PAGE_ACCESS_TOKEN; // Add your Page access token here

// Route for GET requests
app.get("/", (req, res) => {
  const {
    "hub.mode": mode,
    "hub.challenge": challenge,
    "hub.verify_token": token,
  } = req.query;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("WEBHOOK VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Route for POST requests
app.post("/", async (req, res) => {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`\n\nWebhook received ${timestamp}\n`);
  console.log(JSON.stringify(req.body, null, 2));

  // Extract message info
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const from = message.from; // sender's phone number
      const name = message?.profile?.name || "user";

      // Send reply back
      await axios.post(
        `https://graph.facebook.com/v21.0/${value.metadata.phone_number_id}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: `Hello, ${name}` },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`✅ Replied to ${from} with "Hello, ${name}"`);
    }
  } catch (err) {
    console.error("Error handling message:", err.response?.data || err.message);
  }

  res.sendStatus(200);
});

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
