import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  name: String,
  quantity: Number,
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  price: Number,
  status: {
    type: String,
    enum: ["Purchased", "Missing", "Substituted"],
    default: "Purchased"
  }
});

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vendor" }],
    items: [OrderItemSchema],
    totalCost: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" }
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
