const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
// Import route files
const authRoutes = require("./routes/authRoutes");
const factoryRoutes = require("./routes/factoryRoutes");
const machineRoutes = require("./routes/machineRoutes");
const transferRoutes = require("./routes/transferRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const machineIdleRoutes = require("./routes/machineIdleRoutes");
// Load environment variables from .env file
dotenv.config();

const app = express();

// ==========================
// Middleware
// ==========================

// Enable CORS so that frontend (React) can make requests from another origin
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // form data পার্স করার জন্য
// ==========================
// Routes
// ==========================

// Routes for Users
// Routes for authentication (login/signup)
app.use("/api/auth", authRoutes);
// Routes for factories
// All routes in factoryRoutes.js will be prefixed with /api/factories
app.use("/api/factories", factoryRoutes);

// Routes for machines
// All routes in machineRoutes.js will be prefixed with /api/machines
app.use("/api/machines", machineRoutes);

// Routes for transfer
// All routes in transferRoutes.js will be prefixed with /api/transfers
app.use("/api/transfers", transferRoutes);

// Routes for maintenance
// All routes in maintenanceRoutes.js will be prefixed with /api/maintenances
app.use("/api/maintenances", maintenanceRoutes);

// Routes for machine idle
// All routes in machineIdleRoutes.js will be prefixed with /api/machineidles
app.use("/api/machineidles", machineIdleRoutes);

// ==========================
// Serve React build in production
// ==========================
const clientBuildPath = path.join(__dirname, "../machine-client/build");
app.use(express.static(clientBuildPath));

// Any route not matching API will return React index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});
// ==========================
// MongoDB Connection
// ==========================

mongoose
  .connect(process.env.MONGO_URI) // Connect to MongoDB using URI from .env
  .then(() => {
    console.log("✅ MongoDB Connected");

    // Start Express server after successful DB connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ DB Connection Error:", err));
