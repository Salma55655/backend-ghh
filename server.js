import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import Application from "./models/Application.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ---- CONNECT TO MONGODB (CORRECT WAY) ----
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("🌿 Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB error:", err));

// ---- MULTER CONFIG ----
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

// // ---- API ROUTE ----
// app.post("/api/apply", upload.single("researchFile"), async (req, res) => {
//   try {
//     const {
//       fullName,
//       email,
//       dob,
//       gender,
//       executiveSummary,
//       inspiration,
//       futureImpact,
//     } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ message: "Research PDF is required" });
//     }

//     const newApplication = await Application.create({
//       fullName,
//       email,
//       dob,
//       gender,
//       executiveSummary,
//       inspiration,
//       futureImpact,
//       researchFile: {
//         filename: req.file.filename,
//         path: req.file.path,
//         mimetype: req.file.mimetype,
//         size: req.file.size,
//       },
//     });

//     res.status(201).json({
//       message: "Application submitted successfully",
//       applicationId: newApplication._id,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error. Please try again." });
//   }
// });


app.post("/api/apply", upload.single("researchFile"), async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

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
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
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

// ---- START SERVER ----
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
