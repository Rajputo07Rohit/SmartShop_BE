import mongoose from "mongoose";

const StockSchema = new mongoose.Schema({
  itemName: String,
  price: Number,
  availableQty: Number
});

const VendorSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true } // [lng, lat]
    },
    stock: [StockSchema]
  },
  { timestamps: true }
);

VendorSchema.index({ location: "2dsphere" });

export default mongoose.model("Vendor", VendorSchema);
