import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  dob: { type: String, required: true },
  gender: { type: String, required: true },
  executiveSummary: { type: String, required: true },
  inspiration: { type: String, required: true },
  futureImpact: { type: String, required: true },
  researchFile: {
    filename: { type: String, required: true },
    path: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
  },
}, { timestamps: true });

export default mongoose.model("Application", applicationSchema);
