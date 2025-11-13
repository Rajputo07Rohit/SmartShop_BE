import mongoose from "mongoose";

const ShoppingListSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("ShoppingList", ShoppingListSchema);
