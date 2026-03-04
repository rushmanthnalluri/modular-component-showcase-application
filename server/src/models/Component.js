import mongoose from "mongoose";

const componentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    thumbnail: { type: String, default: "" },
    screenshot: { type: String, default: "" },
    code: {
      jsx: { type: String, required: true },
      css: { type: String, default: "" },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Component", componentSchema);
