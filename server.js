const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const serverless = require("serverless-http");

const app = express();

const uri = `mongodb+srv://mygvp0:kumarram59266@mygvp0.wrf9s.mongodb.net/mygvp?retryWrites=true&w=majority&appName=MyGVP0`;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

const gpaSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true },
  gpas: {
    type: Map,
    of: Number,
  },
});

const Gpa = mongoose.model("Result", gpaSchema, "results");

app.use(cors());
app.use(express.json());

app.post("/save-gpa", async (req, res) => {
  const { registrationNumber, gpas } = req.body;

  try {
    if (typeof registrationNumber !== "string" || typeof gpas !== "object") {
      return res.status(400).json({ error: "Invalid input format" });
    }

    const existingGpa = await Gpa.findOne({ registrationNumber });

    if (existingGpa) {
      for (const [sem, gpa] of Object.entries(gpas)) {
        existingGpa.gpas.set(sem, gpa);
      }
      await existingGpa.save();
    } else {
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

app.get("/get-gpa/:registrationNumber", async (req, res) => {
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

module.exports = serverless(app);