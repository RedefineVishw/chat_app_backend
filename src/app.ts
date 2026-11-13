import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found Please check the URL and try again.",
    });
});

// Error handler (always last)
app.use(errorHandler);

export default app;