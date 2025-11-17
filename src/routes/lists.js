import express from "express";
import auth from "../middleware/auth.js";
import ShoppingList from "../models/ShoppingList.js";
import Item from "../models/Item.js";

const router = express.Router();

// Create list
router.post("/", auth, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });

  const list = await ShoppingList.create({
    userId: req.user.userId,
    title,
  });

  res.json(list);
});

// Get all user lists
router.get("/", auth, async (req, res) => {
  const lists = await ShoppingList.find({
    userId: req.user.userId,
  }).sort({ createdAt: -1 });

  res.json(lists);
});

// Get list items
router.get("/:id/items", auth, async (req, res) => {
  const items = await Item.find({
    listId: req.params.id,
  }).sort({ createdAt: -1 });

  res.json(items);
});

// Add item to list
router.post("/:id/items", auth, async (req, res) => {
  const { name, quantity, brandPreference } = req.body;

  if (!name) return res.status(400).json({ error: "Item name required" });

  const item = await Item.create({
    listId: req.params.id,
    name,
    quantity: quantity || 1,
    brandPreference: brandPreference || "",
  });

  res.json(item);
});

// ✅ DELETE item from list
router.delete("/:listId/items/:itemId", auth, async (req, res) => {
  try {
    const { listId, itemId } = req.params;

    // Validate list belongs to user
    const list = await ShoppingList.findOne({
      _id: listId,
      userId: req.user.userId,
    });

    if (!list) {
      return res.status(404).json({ error: "List not found or unauthorized" });
    }

    // Delete the item
    const deleted = await Item.findOneAndDelete({
      _id: itemId,
      listId,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ success: true, message: "Item removed" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;
