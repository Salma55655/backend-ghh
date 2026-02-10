import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  dob: { type: String, required: true }, // Changed to String to match HTML date input format easily
  gender: { type: String, required: true },
  executiveSummary: { type: String, required: true },
  inspiration: { type: String, required: true },
  futureImpact: { type: String, required: true },
  researchFile: {
    filename: { type: String },
    path: { type: String },
    mimetype: { type: String },
    size: { type: Number }
  },
  status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'rejected'] },
  createdAt: { type: Date, default: Date.now }
});

// module.exports = mongoose.model('Application', applicationSchema);

const Application = mongoose.model("Application", applicationSchema);

export default Application;