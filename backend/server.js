require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { connectToMongoDB } = require("./utils/mongoClient"); // Adjust the path to your mongoClient.js
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// Simple Home Route (for testing)
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Errand Platform Backend!" });
});

// Import routes
const agentRoutes = require("./routes/agent");
const userRoutes = require("./routes/user");
const taskRoutes = require("./routes/task");
const registerRoute = require("./routes/register");
const loginRoute = require("./routes/login");

// Use routes
app.use("/api/agents", agentRoutes);
app.use("/api/users", userRoutes);
app.use("/tasks", taskRoutes); 
app.use("/api/register", registerRoute);
app.use("/api/login", loginRoute);
app.use("/api/analytics", analyticsRoutes);

// MongoDB connection string
const mongoURL = process.env.MONGODB_URL;

if (!mongoURL) {
  console.error("MongoDB URI is not defined. Please check your .env file.");
  process.exit(1); // Exit process if URI is not defined
}

// Connect to MongoDB using Mongoose
mongoose
  .connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(`MongoDB Connected: ${mongoURL}`)) // Log the MongoDB URL for debugging
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process on connection failure
  });

// Connect to MongoDB using Native Driver (for Task functionality)
(async () => {
  try {
    const db = await connectToMongoDB();
    app.locals.db = db; // Attach the DB instance to app.locals for use in taskController
    console.log("Connected to MongoDB using Native Driver (Tasks)");
  } catch (error) {
    console.error("Error connecting to MongoDB (Native Driver):", error);
    process.exit(1); // Exit the process if the connection fails
  }
})();

// Middleware to map email as `userId` in task-related routes
app.use("/api/tasks", (req, res, next) => {
  if (req.body.email) {
    req.body.userId = req.body.email; // Use email as the userId
  }
  next(); // Proceed to task routes
});

// Temporary route for debugging POST requests to /api/tasks
app.post("/api/tasks", (req, res) => {
  console.log(req.body); // Log the incoming request body
  res.status(200).send("Request received!"); // Respond with a simple message
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "An unexpected error occurred!" });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
