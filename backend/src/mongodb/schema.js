import mongoose from "mongoose";

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
        componentName: { type: String, default: "", trim: true },
        category: { type: String, default: "", trim: true },
        text: { type: String, default: "", trim: true },
        model: { type: String, default: "mock", trim: true },
        provider: { type: String, default: "deterministic", trim: true },
        embeddingHash: { type: String, default: "", trim: true },
        embedding: { type: [Number], required: true },
    },
    { timestamps: true, collection: "component_embeddings" }
);

componentEmbeddingSchema.index({ componentName: 1 });
componentEmbeddingSchema.index({ category: 1 });
componentEmbeddingSchema.index({ embeddingHash: 1 });

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

export const ComponentDescription = mongoose.models.ComponentDescription || mongoose.model("ComponentDescription", componentDescriptionSchema);
export const ComponentEmbedding = mongoose.models.ComponentEmbedding || mongoose.model("ComponentEmbedding", componentEmbeddingSchema);
export const UsageLog = mongoose.models.UsageLog || mongoose.model("UsageLog", usageLogSchema);
