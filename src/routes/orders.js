import express from "express";
import auth from "../middleware/auth.js";
import Order from "../models/Order.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  const { vendorIds, items, totalCost } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items" });
  }
  const order = await Order.create({
    userId: req.user.userId,
    vendorIds: vendorIds || [],
    items,
    totalCost: totalCost || 0,
    paymentStatus: "Pending"
  });
  res.json(order);
});

router.get("/:id", auth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.userId.toString() !== req.user.userId) return res.status(403).json({ error: "Forbidden" });
  res.json(order);
});

export default router;
