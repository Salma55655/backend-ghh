


import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import Application from "./models/Application.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("🌿 Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB error:", err));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDFs allowed"));
    }
    cb(null, true);
  },
});

// ---- PUBLIC API: SUBMIT APPLICATION ----
app.post("/api/apply", upload.single("researchFile"), async (req, res) => {
  try {
    const { fullName, email, dob, gender, executiveSummary, inspiration, futureImpact } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Research PDF is required" });
    }


    const newApplication = await Application.create({
      fullName,
      email,
      dob,
      gender,
      executiveSummary,
      inspiration,
      futureImpact,
      researchFile: {
      filename: req.file.filename,
      fileId: req.file.id,              // real reference in Mongo
      url: `/api/file/${req.file.id}`  // stable way to read it later
    }, 

      status: 'pending' // Default status
    });

    res.status(201).json({
      message: "Application submitted successfully",
      applicationId: newApplication._id,
    });
  } catch (error) {
    console.error("ERROR in /api/apply:", error);
    res.status(500).json({ message: "Server error. Please check logs." });
  }
});

// ---- ADMIN API: GET ALL APPLICATIONS ----
app.get("/api/applications", async (req, res) => {
  try {
    const apps = await Application.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

// ---- ADMIN API: UPDATE STATUS ----
app.patch("/api/applications/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const updated = await Application.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});



app.get("/api/file/:id", async (req, res) => {
  try {
    const file = await gfs.files.findOne({
      _id: mongoose.Types.ObjectId(req.params.id),
    });

    if (!file) return res.status(404).json({ message: "File not found" });

    const readStream = gfs.createReadStream({ _id: file._id });
    res.set("Content-Type", file.contentType);
    readStream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving file" });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
