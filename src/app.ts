import express from "express";

// Middleware packages
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Routes and middleware
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import errorHandler from "./middlewares/error.middleware.js";
import { responseMiddleware } from "./middlewares/response.middleware.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URI, credentials: true }));

// Logging middleware
app.use(morgan("dev"));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(responseMiddleware);

// API routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found Please check the URL and try again.",
    });
});

// Error handler
app.use(errorHandler);

export default app;