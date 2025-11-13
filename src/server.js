import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import listRoutes from "./routes/lists.js";
import vendorRoutes from "./routes/vendors.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";

dotenv.config();

const app = express();
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

// Mongo
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shopping_list_project";
mongoose
  .connect(MONGO_URI, { dbName: MONGO_URI.split('/').pop() })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("Mongo connection error", err));

app.get("/", (req, res) => res.json({ ok: true, message: "Shopping List API" }));

app.use("/api/auth", authRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
