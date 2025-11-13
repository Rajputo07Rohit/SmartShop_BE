import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    listId: { type: mongoose.Schema.Types.ObjectId, ref: "ShoppingList", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    brandPreference: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Item", ItemSchema);
