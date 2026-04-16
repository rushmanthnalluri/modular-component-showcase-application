import mongoose from "mongoose";

// Enhanced User Schema with profile, statistics, and submission history
const userSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, default: "", trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ["user", "developer", "admin"], default: "user" },
        isVerifiedDeveloper: { type: Boolean, default: false },
        favorites: { type: [String], default: [] },
        
        // User profile
        bio: { type: String, default: "", trim: true, maxlength: 500 },
        avatarUrl: { type: String, default: "" },
        socialLinks: {
            twitter: { type: String, default: "" },
            github: { type: String, default: "" },
            portfolio: { type: String, default: "" },
        },
        
        // Statistics
        stats: {
            totalComponentsSubmitted: { type: Number, default: 0 },
            totalComponentsViewed: { type: Number, default: 0 },
            averageRating: { type: Number, default: 0, min: 0, max: 5 },
        },
        
        // Email preferences
        emailPreferences: {
            newComponents: { type: Boolean, default: true },
            reviewComments: { type: Boolean, default: true },
            newsletters: { type: Boolean, default: false },
        },
    },
    { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ createdAt: -1 });

// Enhanced Component Schema with versioning, metadata, and tracking
const componentSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        descriptionMarkdown: { type: String, default: "", trim: true }, // Markdown support
        category: { type: String, required: true, trim: true },
        tags: { type: [String], default: [] },
        thumbnail: { type: String, default: "" },
        screenshot: { type: String, default: "" },
        code: {
            jsx: { type: String, required: true },
            css: { type: String, default: "" },
        },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        
        // Versioning
        version: { type: String, default: "1.0.0" },
        versions: [
            {
                version: String,
                code: {
                    jsx: String,
                    css: String,
                },
                changelog: String,
                createdAt: Date,
            }
        ],
        
        // Props documentation
        props: [
            {
                name: String,
                type: String,
                default: String,
                description: String,
                required: { type: Boolean, default: false },
            }
        ],
        
        // Usage examples
        usageExamples: [
            {
                title: String,
                code: String,
                description: String,
            }
        ],
        
        // Best practices and pitfalls
        bestPractices: [String],
        commonPitfalls: [String],
        
        // Dependencies
        dependencies: { type: [String], default: [] }, // Component IDs that this depends on
        relatedComponents: { type: [String], default: [] }, // Suggested components to pair with
        
        // Import statements for different setups
        importStatements: {
            standard: { type: String, default: "" },
            typescript: { type: String, default: "" },
            npm: { type: String, default: "" },
        },
        
        // Statistics and tracking
        viewCount: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        totalReviews: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: true },
        isFeatured: { type: Boolean, default: false },
        
        // Performance metrics
        performanceMetrics: {
            bundleSize: { type: String, default: "" },
            renderTime: { type: String, default: "" },
            dependencies: { type: Number, default: 0 },
        },
        
        // Accessibility
        accessibilityScore: { type: Number, default: 0, min: 0, max: 100 },
        accessibilityReport: { type: String, default: "" },
    },
    { timestamps: true }
);

componentSchema.index({ createdBy: 1 });
componentSchema.index({ category: 1 });
componentSchema.index({ tags: 1 });
componentSchema.index({ createdAt: -1 });
componentSchema.index({ averageRating: -1 });
componentSchema.index({ viewCount: -1 });

// Rating Schema
const ratingSchema = new mongoose.Schema(
    {
        componentId: { type: mongoose.Schema.Types.ObjectId, ref: "Component", required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
    },
    { timestamps: true }
);

ratingSchema.index({ componentId: 1, userId: 1 }, { unique: true });
ratingSchema.index({ componentId: 1 });
ratingSchema.index({ userId: 1 });

// Review/Comment Schema
const reviewSchema = new mongoose.Schema(
    {
        componentId: { type: mongoose.Schema.Types.ObjectId, ref: "Component", required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        title: { type: String, trim: true, maxlength: 200 },
        comment: { type: String, required: true, trim: true, maxlength: 5000 },
        helpful: { type: Number, default: 0 },
        unhelpful: { type: Number, default: 0 },
        isVerified: { type: Boolean, default: false }, // If user has used the component
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
    },
    { timestamps: true }
);

reviewSchema.index({ componentId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ componentId: 1, createdAt: -1 });

// Component View/Statistics Schema
const componentViewSchema = new mongoose.Schema(
    {
        componentId: { type: mongoose.Schema.Types.ObjectId, ref: "Component", required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", sparse: true }, // null for anonymous users
        viewedAt: { type: Date, default: Date.now },
        sessionId: String,
        ipHash: String,
    },
    { timestamps: true }
);

componentViewSchema.index({ componentId: 1, viewedAt: -1 });
componentViewSchema.index({ componentId: 1, createdAt: -1 });

// Component Dependency Schema
const componentDependencySchema = new mongoose.Schema(
    {
        componentId: { type: mongoose.Schema.Types.ObjectId, ref: "Component", required: true },
        dependencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Component", required: true },
        type: { type: String, enum: ["requires", "suggested", "alternative"], default: "suggested" },
    },
    { timestamps: true }
);

componentDependencySchema.index({ componentId: 1 });
componentDependencySchema.index({ dependencyId: 1 });

// Submission History Schema
const submissionHistorySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        componentId: { type: mongoose.Schema.Types.ObjectId, ref: "Component", required: true },
        action: { type: String, enum: ["created", "updated", "deleted", "published"], required: true },
        changes: mongoose.Schema.Types.Mixed, // Store what changed
        reason: String,
    },
    { timestamps: true }
);

submissionHistorySchema.index({ userId: 1, createdAt: -1 });
submissionHistorySchema.index({ componentId: 1, createdAt: -1 });

// Component discussion thread schema
const discussionSchema = new mongoose.Schema(
    {
        componentId: { type: mongoose.Schema.Types.ObjectId, ref: "Component", required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Discussion", default: null },
        message: { type: String, required: true, trim: true, maxlength: 4000 },
        likes: { type: Number, default: 0 },
        status: { type: String, enum: ["active", "hidden"], default: "active" },
    },
    { timestamps: true }
);

discussionSchema.index({ componentId: 1, createdAt: -1 });
discussionSchema.index({ parentId: 1 });

// Markdown tutorial/blog schema
const blogPostSchema = new mongoose.Schema(
    {
        slug: { type: String, required: true, unique: true },
        title: { type: String, required: true, trim: true, maxlength: 180 },
        summary: { type: String, default: "", trim: true, maxlength: 500 },
        markdown: { type: String, required: true },
        tags: { type: [String], default: [] },
        isPublished: { type: Boolean, default: true },
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

blogPostSchema.index({ isPublished: 1, createdAt: -1 });

const componentDescriptionSchema = new mongoose.Schema(
    {
        componentId: { type: String, required: true, unique: true, trim: true },
        title: { type: String, required: true, trim: true },
        contentMarkdown: { type: String, required: true, trim: true },
        propsReference: { type: [mongoose.Schema.Types.Mixed], default: [] },
        examples: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    { timestamps: true, collection: "component_descriptions" }
);

const componentEmbeddingSchema = new mongoose.Schema(
    {
        componentId: { type: String, required: true, unique: true, trim: true },
        text: { type: String, required: true, trim: true },
        model: { type: String, default: "mock", trim: true },
        embedding: { type: [Number], required: true },
    },
    { timestamps: true, collection: "component_embeddings" }
);

const usageLogSchema = new mongoose.Schema(
    {
        eventType: { type: String, default: "OTHER", trim: true },
        componentId: { type: String, default: "", trim: true },
        userId: { type: String, default: "", trim: true },
        sessionId: { type: String, default: "", trim: true },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true, collection: "usage_logs" }
);

usageLogSchema.index({ eventType: 1, createdAt: -1 });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Component = mongoose.models.Component || mongoose.model("Component", componentSchema);
export const Rating = mongoose.models.Rating || mongoose.model("Rating", ratingSchema);
export const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
export const ComponentView = mongoose.models.ComponentView || mongoose.model("ComponentView", componentViewSchema);
export const ComponentDependency = mongoose.models.ComponentDependency || mongoose.model("ComponentDependency", componentDependencySchema);
export const SubmissionHistory = mongoose.models.SubmissionHistory || mongoose.model("SubmissionHistory", submissionHistorySchema);
export const Discussion = mongoose.models.Discussion || mongoose.model("Discussion", discussionSchema);
export const BlogPost = mongoose.models.BlogPost || mongoose.model("BlogPost", blogPostSchema);
export const ComponentDescription = mongoose.models.ComponentDescription || mongoose.model("ComponentDescription", componentDescriptionSchema);
export const ComponentEmbedding = mongoose.models.ComponentEmbedding || mongoose.model("ComponentEmbedding", componentEmbeddingSchema);
export const UsageLog = mongoose.models.UsageLog || mongoose.model("UsageLog", usageLogSchema);
