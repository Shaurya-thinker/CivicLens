const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth.routes");

dotenv.config();

const app = express();

// Middleware (Zaroori hai taaki server JSON data samajh sake)
app.use(express.json());
app.use(cors());

// Routes (Jo humne abhi banaye hain)
app.use("/api/auth", authRoutes);

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/civiclens";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.log("❌ DB Connection Error:", err));