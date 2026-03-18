import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, default: "", trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ["user", "developer", "admin"], default: "user" },
        isVerifiedDeveloper: { type: Boolean, default: false },
    },
    { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });

const componentSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
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

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Component = mongoose.models.Component || mongoose.model("Component", componentSchema);
