const express = require("express");
const env = require("dotenv");
const connectDB = require("./src/config/db");
env.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send(`hey! This is tpn's express server.`);
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
