const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // For loading environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB URI from environment variables
const uri = process.env.MONGODB_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Define a schema and model for GPA data
const gpaSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true },
  gpas: {
    type: Map,
    of: Number,
  },
});

const Gpa = mongoose.model("Result", gpaSchema, "results");

// Middleware
app.use(cors());
app.use(express.json()); // Automatically parses JSON

// Endpoint to save GPA data
app.post("/api/save-gpa", async (req, res) => {
  const { registrationNumber, gpas } = req.body;

  try {
    if (typeof registrationNumber !== "string" || typeof gpas !== "object") {
      return res.status(400).json({ error: "Invalid input format" });
    }

    // Find the existing GPA record
    const existingGpa = await Gpa.findOne({ registrationNumber });

    if (existingGpa) {
      // Merge new GPAs with existing GPAs
      for (const [sem, gpa] of Object.entries(gpas)) {
        existingGpa.gpas.set(sem, gpa);
      }
      await existingGpa.save();
    } else {
      // Create a new GPA record if it doesn't exist
      const newGpa = new Gpa({
        registrationNumber,
        gpas: new Map(Object.entries(gpas)),
      });
      await newGpa.save();
    }

    res.json({ message: "GPA data saved successfully" });
  } catch (error) {
    console.error("Error saving GPA data:", error.message);
    res.status(500).json({ error: "Error saving GPA data" });
  }
});

// Endpoint to retrieve GPA data
app.get("/api/get-gpa/:registrationNumber", async (req, res) => {
  const { registrationNumber } = req.params;

  try {
    const gpaData = await Gpa.findOne({ registrationNumber });

    if (gpaData) {
      res.json(gpaData);
    } else {
      res.status(404).json({ error: "GPA data not found" });
    }
  } catch (error) {
    console.error("Error retrieving GPA data:", error.message);
    res.status(500).json({ error: "Error retrieving GPA data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
