
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

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) throw new Error("MONGO_URI missing in .env");

// --------------------
// Multer
// --------------------
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") return cb(new Error("Only PDFs allowed"));
    cb(null, true);
  },
});

// --------------------
// Helper: get DB & GridFS bucket
// --------------------

// let cachedConnection = null;

// async function connectDB() {
//   if (cachedConnection) return cachedConnection;

//   cachedConnection = await mongoose.connect(MONGO_URI);
//   console.log("✅ Mongo Connected");

//   return cachedConnection;
// }






let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI);
  }

  cached.conn = await cached.promise;
  console.log("✅ Mongo Connected");

  return cached.conn;
}


function getBucket() {
  return new GridFSBucket(mongoose.connection.db, {
    bucketName: "researchFiles",
  });
}



// function uploadToGridFS(file, bucket) {
//   return new Promise((resolve, reject) => {
//     const uploadStream = bucket.openUploadStream(file.originalname, { contentType: file.mimetype });
//     uploadStream.end(file.buffer);
//     uploadStream.on("finish", resolve);
//     uploadStream.on("error", reject);
//   });
// }

function uploadToGridFS(file, bucket) {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(file.originalname, { contentType: file.mimetype });
    uploadStream.end(file.buffer);
    uploadStream.on("finish", () => resolve(uploadStream)); // ✅ resolve the stream itself
    uploadStream.on("error", reject);
  });
}

if (!process.env.BASE_URL) {
  throw new Error("BASE_URL missing in environment variables");
}

const BASE_URL = process.env.BASE_URL;

app.post("/api/apply", upload.single("researchFile"), async (req, res) => {
  try {
    await connectDB(); 

    if (!req.file) return res.status(400).json({ message: "PDF required" });

    const { fullName, email, dob, gender, executiveSummary, inspiration, futureImpact } = req.body;

    const bucket = await getBucket();
    const file = await uploadToGridFS(req.file, bucket);


    
    const newApplication = await Application.create({
      fullName,
      email,
      dob,
      gender,
      executiveSummary,
      inspiration,
      futureImpact,
      researchFile: {
        fileId: file.id.toString(),
        filename: file.filename,
        url: `${BASE_URL}/api/file/${file.id}`,
      },
      status: "pending",
    });

    res.status(201).json({ message: "Application submitted", applicationId: newApplication._id });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// --------------------
// GET file
// --------------------
app.get("/api/file/:id", async (req, res) => {
  try {
    await connectDB(); 
    const bucket = await getBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) return res.status(404).json({ message: "File not found" });

    const file = files[0];
    res.setHeader("Content-Type", file.contentType || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).end();
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error("FILE ERROR:", err);
    res.status(500).json({ message: "File retrieval error" });
  }
});

// --------------------
// Other routes
// --------------------
app.get("/api/applications", async (req, res) => {
  try {
    await connectDB(); 

    const apps = await Application.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

app.patch("/api/applications/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected", "pending"].includes(status)) return res.status(400).json({ message: "Invalid status" });

    const updated = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

export default app;










// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import multer from "multer";
// import dotenv from "dotenv";
// import { GridFSBucket } from "mongodb";
// import Application from "./models/Application.js";




// // dotenv.config();
// const app = express();

// const MONGO_URI= "mongodb+srv://salmaahmed555655_db_user:oo03s2hwj5rRF837@cluster0.sjw5myr.mongodb.net/green_prize?retryWrites=true&w=majority"


// app.use(cors());
// app.use(express.json());

// if (!MONGO_URI) throw new Error("MONGO_URI missing in .env");

// // --------------------
// // Multer - Configure for memory storage (works with Vercel)
// // --------------------
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB (Vercel limit is 4.5MB for free tier)
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype !== "application/pdf") {
//       return cb(new Error("Only PDFs allowed"), false);
//     }
//     cb(null, true);
//   },
// });

// // --------------------
// // Database Connection (optimized for serverless)
// // --------------------
// let cachedConnection = null;

// async function connectDB() {
//   if (cachedConnection && mongoose.connection.readyState === 1) {
//     console.log("✅ Using cached MongoDB connection");
//     return cachedConnection;
//   }

//   try {
//     const connection = await mongoose.connect(MONGO_URI, {
//       bufferCommands: false,
//       bufferMaxEntries: 0,
//       serverSelectionTimeoutMS: 5000,
//       socketTimeoutMS: 30000,
//     });
    
//     cachedConnection = connection;
//     console.log("✅ MongoDB Connected");
//     console.log("Mongo readyState:", mongoose.connection.readyState);
    
//     return connection;
//   } catch (error) {
//     console.error("MongoDB connection error:", error);
//     throw error;
//   }
// }

// function getBucket() {
//   if (!mongoose.connection.db) {
//     throw new Error("Database not connected");
//   }
//   return new GridFSBucket(mongoose.connection.db, {
//     bucketName: "researchFiles",
//   });
// }

// function uploadToGridFS(file, bucket) {
//   return new Promise((resolve, reject) => {
//     const uploadStream = bucket.openUploadStream(file.originalname, { 
//       contentType: file.mimetype 
//     });
    
//     uploadStream.end(file.buffer);
    
//     uploadStream.on("finish", (uploadedFile) => {
//       resolve(uploadedFile);
//     });
    
//     uploadStream.on("error", (error) => {
//       reject(error);
//     });
//   });
// }

// // --------------------
// // POST application
// // --------------------
// const BASE_URL ="http://localhost:3001/"  // Update this!

// app.post("/api/apply", upload.single("researchFile"), async (req, res) => {
//   try {
//     await connectDB(); 

//     // Check if file exists
//     if (!req.file) {
//       return res.status(400).json({ message: "PDF file is required" });
//     }

//     // Parse form data
//     const { fullName, email, dob, gender, executiveSummary, inspiration, futureImpact } = req.body;

//     // Validate required fields
//     if (!fullName || !email || !dob || !gender) {
//       return res.status(400).json({ 
//         message: "Missing required fields",
//         required: ["fullName", "email", "dob", "gender"]
//       });
//     }

//     // Upload file to GridFS
//     const bucket = getBucket();
//     const file = await uploadToGridFS(req.file, bucket);

//     // Create application record
//     const newApplication = await Application.create({
//       fullName,
//       email,
//       dob,
//       gender,
//       executiveSummary: executiveSummary || "",
//       inspiration: inspiration || "",
//       futureImpact: futureImpact || "",
//       researchFile: {
//         fileId: file._id.toString(),
//         filename: file.filename,
//         url: `${BASE_URL}/api/file/${file._id}`,
//       },
//       status: "pending",
//     });

//     res.status(201).json({ 
//       message: "Application submitted successfully", 
//       applicationId: newApplication._id,
//       fileId: file._id
//     });
//   } catch (err) {
//     console.error("UPLOAD ERROR:", err);
//     res.status(500).json({ 
//       message: "Upload failed", 
//       error: err.message 
//     });
//   }
// });

// // --------------------
// // GET file from GridFS
// // --------------------
// app.get("/api/file/:id", async (req, res) => {
//   try {
//     await connectDB();
    
//     const bucket = getBucket();
//     const fileId = new mongoose.Types.ObjectId(req.params.id);
    
//     // Find the file metadata
//     const files = await bucket.find({ _id: fileId }).toArray();
    
//     if (!files || files.length === 0) {
//       return res.status(404).json({ message: "File not found" });
//     }

//     const file = files[0];
    
//     // Set response headers
//     res.setHeader("Content-Type", file.contentType || "application/pdf");
//     res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.filename)}"`);
    
//     // Create download stream
//     const downloadStream = bucket.openDownloadStream(fileId);
    
//     // Handle stream errors
//     downloadStream.on("error", (err) => {
//       console.error("Stream error:", err);
//       if (!res.headersSent) {
//         res.status(500).json({ message: "Error streaming file" });
//       }
//     });

//     // Pipe the file to response
//     downloadStream.pipe(res);
    
//   } catch (err) {
//     console.error("FILE ERROR:", err);
//     if (!res.headersSent) {
//       res.status(500).json({ message: "File retrieval error" });
//     }
//   }
// });

// // --------------------
// // Get all applications
// // --------------------
// app.get("/api/applications", async (req, res) => {
//   try {
//     await connectDB();
    
//     const apps = await Application.find()
//       .sort({ createdAt: -1 })
//       .select('-__v'); // Exclude version field
    
//     res.json(apps);
//   } catch (err) {
//     console.error("Error fetching applications:", err);
//     res.status(500).json({ message: "Failed to fetch applications" });
//   }
// });

// // --------------------
// // Get single application
// // --------------------
// app.get("/api/applications/:id", async (req, res) => {
//   try {
//     await connectDB();
    
//     const app = await Application.findById(req.params.id);
    
//     if (!app) {
//       return res.status(404).json({ message: "Application not found" });
//     }
    
//     res.json(app);
//   } catch (err) {
//     console.error("Error fetching application:", err);
//     res.status(500).json({ message: "Failed to fetch application" });
//   }
// });

// // --------------------
// // Update application status
// // --------------------
// app.patch("/api/applications/:id/status", async (req, res) => {
//   try {
//     await connectDB();
    
//     const { status } = req.body;
    
//     if (!["accepted", "rejected", "pending"].includes(status)) {
//       return res.status(400).json({ message: "Invalid status. Must be 'accepted', 'rejected', or 'pending'" });
//     }

//     const updated = await Application.findByIdAndUpdate(
//       req.params.id, 
//       { status }, 
//       { new: true }
//     );
    
//     if (!updated) {
//       return res.status(404).json({ message: "Application not found" });
//     }
    
//     res.json(updated);
//   } catch (err) {
//     console.error("Update error:", err);
//     res.status(500).json({ message: "Update failed" });
//   }
// });

// // --------------------
// // Health check endpoint
// // --------------------
// app.get("/api/health", (req, res) => {
//   res.json({ 
//     status: "OK", 
//     mongoState: mongoose.connection.readyState,
//     mongoStateText: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
//     timestamp: new Date().toISOString()
//   });
// });

// // --------------------
// // Root endpoint
// // --------------------
// app.get("/", (req, res) => {
//   res.json({ 
//     message: "Green Prize API", 
//     version: "1.0.0",
//     status: "running",
//     endpoints: [
//       "POST /api/apply - Submit application with PDF",
//       "GET /api/applications - Get all applications",
//       "GET /api/applications/:id - Get single application", 
//       "GET /api/file/:id - Download PDF file",
//       "PATCH /api/applications/:id/status - Update status",
//       "GET /api/health - Health check"
//     ]
//   });
// });


// // Test endpoint to check if multer is working
// app.post("/api/test-upload", upload.single("testFile"), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }
    
//     res.json({
//       message: "Upload test successful",
//       fileInfo: {
//         originalname: req.file.originalname,
//         mimetype: req.file.mimetype,
//         size: req.file.size,
//         encoding: req.file.encoding
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Upload test failed", error: error.message });
//   }
// });

// // Add this temporary test endpoint
// app.get("/api/test-connection", async (req, res) => {
//   try {
//     await connectDB();
//     const dbState = mongoose.connection.readyState;
//     const stateMap = {
//       0: "disconnected",
//       1: "connected",
//       2: "connecting",
//       3: "disconnecting"
//     };
    
//     // Try to list collections to verify access
//     const collections = await mongoose.connection.db.listCollections().toArray();
    
//     res.json({
//       message: "Database connection test",
//       connectionState: stateMap[dbState] || "unknown",
//       readyState: dbState,
//       collections: collections.map(c => c.name),
//       dbName: mongoose.connection.name,
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Database connection failed",
//       error: error.message
//     });
//   }
// });



// const PORT = 3001;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


// // console.log("Mongo readyState:", mongoose.connection.readyState);
