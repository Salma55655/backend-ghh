


// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import multer from "multer";
// import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from 'url';
// import Application from "./models/Application.js";



// import Grid from 'gridfs-stream';
// import { GridFsStorage } from 'multer-gridfs-storage';



// dotenv.config();
// const app = express();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// app.use(cors());
// app.use(express.json());
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// const MONGO_URI = process.env.MONGO_URI;

// if (!MONGO_URI) {
//   console.error("❌ MONGO_URI is missing in .env");
//   process.exit(1);
// }

// mongoose
//   .connect(MONGO_URI)
//   .then(() => console.log("🌿 Connected to MongoDB Atlas"))
//   .catch((err) => console.error("MongoDB error:", err));

// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, "uploads/");
// //   },
// //   filename: (req, file, cb) => {
// //     cb(null, Date.now() + "-" + file.originalname);
// //   },
// // });


// let gfs;

// mongoose.connection.once('open', () => {
//   gfs = Grid(mongoose.connection.db, mongoose.mongo);
//   gfs.collection('researchFiles'); // collection name
// });

// const storage = new GridFsStorage({
//   url: MONGO_URI,
//   file: (req, file) => {
//     return {
//       filename: `${Date.now()}-${file.originalname}`,
//       bucketName: 'researchFiles' // matches gfs.collection
//     };
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype !== "application/pdf") return cb(new Error("Only PDFs allowed"));
//     cb(null, true);
//   }
// });


// // const upload = multer({
// //   storage,
// //   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
// //   fileFilter: (req, file, cb) => {
// //     if (file.mimetype !== "application/pdf") {
// //       return cb(new Error("Only PDFs allowed"));
// //     }
// //     cb(null, true);
// //   },
// // });

// // ---- PUBLIC API: SUBMIT APPLICATION ----
// app.post("/api/apply", upload.single("researchFile"), async (req, res) => {
//   try {
//     const { fullName, email, dob, gender, executiveSummary, inspiration, futureImpact } = req.body;

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
//        researchFile: {
//         filename: req.file.filename,
//         fileId: req.file.id.toString(), // store the GridFS file ID
//         url: `/api/file/${req.file.id}` // frontend can use this to download
//       },

//       status: 'pending' // Default status
//     });

//     res.status(201).json({
//       message: "Application submitted successfully",
//       applicationId: newApplication._id,
//     });
//   } catch (error) {
//     console.error("ERROR in /api/apply:", error);
//     res.status(500).json({ message: "Server error. Please check logs." });
//   }
// });

// // ---- ADMIN API: GET ALL APPLICATIONS ----
// app.get("/api/applications", async (req, res) => {
//   try {
//     const apps = await Application.find().sort({ createdAt: -1 });
//     res.json(apps);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch applications" });
//   }
// });

// // ---- ADMIN API: UPDATE STATUS ----
// app.patch("/api/applications/:id/status", async (req, res) => {
//   try {
//     const { status } = req.body;
//     if (!['accepted', 'rejected', 'pending'].includes(status)) {
//       return res.status(400).json({ message: "Invalid status" });
//     }
//     const updated = await Application.findByIdAndUpdate(
//       req.params.id, 
//       { status }, 
//       { new: true }
//     );
//     res.json(updated);
//   } catch (error) {
//     res.status(500).json({ message: "Update failed" });
//   }
// });

// // app.get("/api/file/:id", async (req, res) => {
// //   try {
// //     const file = await gfs.files.findOne({
// //       _id: mongoose.Types.ObjectId(req.params.id),
// //     });

// //     if (!file) return res.status(404).json({ message: "File not found" });

// //     const readStream = gfs.createReadStream({ _id: file._id });
// //     res.set("Content-Type", file.contentType);
// //     readStream.pipe(res);
// //   } catch (err) {
// //     res.status(500).json({ message: "Error retrieving file" });
// //   }
// // });


// app.get("/api/file/:id", async (req, res) => {
//   try {
//     const fileId = new mongoose.Types.ObjectId(req.params.id);
//     const file = await gfs.files.findOne({ _id: fileId });

//     if (!file) return res.status(404).json({ message: "File not found" });

//     res.set("Content-Type", file.contentType);
//     const readStream = gfs.createReadStream({ _id: file._id });
//     readStream.pipe(res);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error retrieving file" });
//   }
// });


// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });




// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import multer from "multer";
// import dotenv from "dotenv";
// import { GridFSBucket } from "mongodb";
// import Application from "./models/Application.js";

// dotenv.config();
// const app = express();

// app.use(cors());
// app.use(express.json());

// const MONGO_URI = process.env.MONGO_URI;
// if (!MONGO_URI) {
//   console.error("❌ MONGO_URI missing in .env");
//   process.exit(1);
// }

// let bucket;

// // --------------------
// // MongoDB connection
// // --------------------
// mongoose
//   .connect(MONGO_URI)
//   .then(() => console.log("🌿 MongoDB connected"))
//   .catch((err) => console.error("Mongo error:", err));

// mongoose.connection.once("open", () => {
//   bucket = new GridFSBucket(mongoose.connection.db, {
//     bucketName: "researchFiles",
//   });
//   console.log("📦 GridFS ready");

// });
// // --------------------
// // Multer (memory storage)
// // --------------------
// const storage = multer.memoryStorage();

// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype !== "application/pdf") {
//       return cb(new Error("Only PDFs allowed"));
//     }
//     cb(null, true);
//   },
// });

///////////////////////
// 




// =====================================================
// 📌 SUBMIT APPLICATION (UPLOAD PDF TO MONGO)
// =====================================================
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
//       return res.status(400).json({ message: "PDF is required" });
//     }

//     // Upload file to Mongo GridFS
//     const uploadStream = bucket.openUploadStream(req.file.originalname, {
//       contentType: req.file.mimetype,
//     });

//     uploadStream.end(req.file.buffer);

//     // uploadStream.on("finish", async (file) => {
//     //   const newApplication = await Application.create({
//     //     fullName,
//     //     email,
//     //     dob,
//     //     gender,
//     //     executiveSummary,
//     //     inspiration,
//     //     futureImpact,
//     //     researchFile: {
//     //       fileId: file._id.toString(),
//     //       filename: file.filename,
//     //       url: `/api/file/${file._id}`,
//     //     },
//     //     status: "pending",
//     //   });

//     //   res.status(201).json({
//     //     message: "Application submitted",
//     //     applicationId: newApplication._id,
//     //   });
//     // });

//     uploadStream.on("finish", async () => {
//       const fileId = uploadStream.id; // correct id

//       const newApplication = await Application.create({
//         fullName,
//         email,
//         dob,
//         gender,
//         executiveSummary,
//         inspiration,
//         futureImpact,
//         researchFile: {
//           fileId: fileId.toString(),
//           filename: req.file.originalname,
//           url: `/api/file/${fileId}`,
//         },
//         status: "pending",
//       });

//       res.status(201).json({
//         message: "Application submitted",
//         applicationId: newApplication._id,
//       });
//     });

//   } catch (err) {
//     console.error("UPLOAD ERROR:", err);
//     res.status(500).json({ message: "Upload failed" });
//   }
// });


// const BASE_URL = process.env.BACKEND_URL || "http://localhost:3001";

// app.post("/api/apply", upload.single("researchFile"), async (req, res) => {
//   try {
//     if (!bucket) return res.status(503).json({ message: "GridFS not ready" });
//     if (!req.file) return res.status(400).json({ message: "PDF required" });

//     const { fullName, email, dob, gender, executiveSummary, inspiration, futureImpact } = req.body;

//     // upload to GridFS
//     const file = await uploadToGridFS(req.file);

//     const newApplication = await Application.create({
//       fullName,
//       email,
//       dob,
//       gender,
//       executiveSummary,
//       inspiration,
//       futureImpact,
//       researchFile: {
//         fileId: file._id.toString(),
//         filename: file.filename,
//         url: `${BASE_URL}/api/file/${file._id}`, // full URL for deployed frontend
//       },
//       status: "pending",
//     });

//     res.status(201).json({ message: "Application submitted", applicationId: newApplication._id });

//   } catch (err) {
//     console.error("UPLOAD ERROR:", err);
//     res.status(500).json({ message: "Upload failed" });
//   }
// });

// // app.post("/api/apply", upload.single("researchFile"), async (req, res) => {
// //   try {
// //     if (!bucket) {
// //       return res.status(500).json({ message: "GridFS not ready" });
      
// //     }

// //     const {
// //       fullName,
// //       email,
// //       dob,
// //       gender,
// //       executiveSummary,
// //       inspiration,
// //       futureImpact,
// //     } = req.body;

// //     if (!req.file) {
// //       return res.status(400).json({ message: "PDF required" });
// //     }

// //     const uploadStream = bucket.openUploadStream(req.file.originalname, {
// //       contentType: req.file.mimetype,
// //     });

// //     uploadStream.end(req.file.buffer);

// //     uploadStream.on("finish", async () => {
// //       const fileId = uploadStream.id;

// //       const newApplication = await Application.create({
// //         fullName,
// //         email,
// //         dob,
// //         gender,
// //         executiveSummary,
// //         inspiration,
// //         futureImpact,
// //         researchFile: {
// //           fileId: fileId.toString(),
// //           filename: req.file.originalname,
// //           url: `/api/file/${fileId}`,
// //         },
// //         status: "pending",
// //       });

// //       res.status(201).json({
// //         message: "Application submitted",
// //         applicationId: newApplication._id,
// //       });
// //     });

// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ message: "Upload failed" });
// //   }
// // });


// // =====================================================
// // 📌 GET ALL APPLICATIONS (ADMIN)
// // =====================================================
// app.get("/api/applications", async (req, res) => {
//   try {
//     const apps = await Application.find().sort({ createdAt: -1 });
//     res.json(apps);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch applications" });
//   }
// });

// // =====================================================
// // 📌 UPDATE STATUS
// // =====================================================
// app.patch("/api/applications/:id/status", async (req, res) => {
//   try {
//     const { status } = req.body;

//     if (!["accepted", "rejected", "pending"].includes(status)) {
//       return res.status(400).json({ message: "Invalid status" });
//     }

//     const updated = await Application.findByIdAndUpdate(
//       req.params.id,
//       { status },
//       { new: true }
//     );

//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ message: "Update failed" });
//   }
// });

// // =====================================================
// // // 📌 STREAM PDF FROM MONGO TO FRONTEND
// // // =====================================================
// // app.get("/api/file/:id", async (req, res) => {
// //   try {
// //     const fileId = new mongoose.Types.ObjectId(req.params.id);

// //     const files = await bucket.find({ _id: fileId }).toArray();
// //     if (!files.length) {
// //       return res.status(404).json({ message: "File not found" });
// //     }

// //     res.set("Content-Type", files[0].contentType);

// //     const downloadStream = bucket.openDownloadStream(fileId);
// //     downloadStream.pipe(res);
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ message: "File retrieval error" });
// //   }
// // });


// app.get("/api/file/:id", async (req, res) => {
//   try {
//     if (!bucket) {
//       return res.status(500).json({ message: "Bucket not ready" });
//     }

//     const fileId = new mongoose.Types.ObjectId(req.params.id);

//     const files = await bucket.find({ _id: fileId }).toArray();

//     if (!files || files.length === 0) {
//       return res.status(404).json({ message: "File not found" });
//     }

//     const file = files[0];

//     res.setHeader("Content-Type", file.contentType || "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `inline; filename="${file.filename}"`
//     );

//     const downloadStream = bucket.openDownloadStream(fileId);

//     downloadStream.on("error", (err) => {
//       console.error("Stream error:", err);
//       res.status(500).end();
//     });

//     downloadStream.pipe(res);
//   } catch (err) {
//     console.error("FILE ERROR:", err);
//     res.status(500).json({ message: "File retrieval error" });
//   }
// });

// // =====================================================
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });


















import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { GridFSBucket } from "mongodb";
import Application from "./models/Application.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = process.env.BACKEND_URL || "http://localhost:3001";
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

// --------------------
// MongoDB connection (cached for serverless)
// --------------------
let conn = null;
async function connectDB() {
  if (conn) return conn;
  conn = await mongoose.connect(MONGO_URI);

  return conn;
}

// --------------------
// Get GridFS bucket
// --------------------
function getBucket() {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB not connected yet");
  }
  return new GridFSBucket(mongoose.connection.db, { bucketName: "researchFiles" });
}

// --------------------
// Multer setup (memory storage)
// --------------------
const storage = multer.memoryStorage();
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

// =====================================================
// 📌 SUBMIT APPLICATION
// =====================================================
app.post("/api/apply", upload.single("researchFile"), async (req, res) => {
  try {
    await connectDB();
    const bucket = getBucket();

    if (!req.file) return res.status(400).json({ message: "PDF is required" });

    const {
      fullName,
      email,
      dob,
      gender,
      executiveSummary,
      inspiration,
      futureImpact,
    } = req.body;

    // Upload PDF to GridFS
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", async (file) => {
      try {
        const newApplication = await Application.create({
          fullName,
          email,
          dob,
          gender,
          executiveSummary,
          inspiration,
          futureImpact,
          researchFile: {
            fileId: file._id.toString(),
            filename: file.filename,
            url: `${BASE_URL}/api/file/${file._id}`,
          },
          status: "pending",
        });

        res.status(201).json({
          message: "Application submitted",
          applicationId: newApplication._id,
        });
      } catch (err) {
        console.error("DB CREATE ERROR:", err.stack || err);
        res.status(500).json({ message: "Database error" });
      }
    });

    uploadStream.on("error", (err) => {
      console.error("UPLOAD STREAM ERROR:", err.stack || err);
      res.status(500).json({ message: "File upload failed" });
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err.stack || err);
    res.status(500).json({ message: err.message });
  }
});

// =====================================================
// 📌 GET ALL APPLICATIONS (ADMIN)
// =====================================================
app.get("/api/applications", async (req, res) => {
  try {
    await connectDB();
    const apps = await Application.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    console.error("FETCH APPS ERROR:", err.stack || err);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

// =====================================================
// 📌 UPDATE STATUS
// =====================================================
app.patch("/api/applications/:id/status", async (req, res) => {
  try {
    await connectDB();
    const { status } = req.body;

    if (!["accepted", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err.stack || err);
    res.status(500).json({ message: "Update failed" });
  }
});

// =====================================================
// 📌 STREAM PDF FROM GRIDFS
// =====================================================
app.get("/api/file/:id", async (req, res) => {
  try {
    await connectDB();
    const bucket = getBucket();

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const files = await bucket.find({ _id: fileId }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const file = files[0];
    res.setHeader("Content-Type", file.contentType || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);

    downloadStream.on("error", (err) => {
      console.error("DOWNLOAD STREAM ERROR:", err.stack || err);
      res.status(500).end();
    });

  } catch (err) {
    console.error("FILE RETRIEVAL ERROR:", err.stack || err);
    res.status(500).json({ message: "File retrieval error" });
  }
});

// =====================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
