import express from "express";
import auth from "../middleware/auth.js";
import Order from "../models/Order.js";

const router = express.Router();

// Mock payment endpoint
router.post("/mock", auth, async (req, res) => {
  const { orderId, status } = req.body; // status: "success" | "failed"
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.userId.toString() !== req.user.userId) return res.status(403).json({ error: "Forbidden" });

  order.paymentStatus = status === "success" ? "Paid" : "Failed";
  await order.save();
  res.json({ ok: true, order });
});

export default router;
