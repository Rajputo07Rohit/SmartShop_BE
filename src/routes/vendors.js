import express from "express";
import Vendor from "../models/Vendor.js";
import Item from "../models/Item.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Haversine
function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Search vendors for a list near user coords
router.get("/search", auth, async (req, res) => {
  const { lat, lng, listId } = req.query;
  if (!lat || !lng || !listId) return res.status(400).json({ error: "lat, lng, listId required" });

  const items = await Item.find({ listId });
  const vendors = await Vendor.find({});

  const results = vendors.map((v) => {
    let covered = 0;
    let cost = 0;
    const missing = [];
    const available = [];

    items.forEach((it) => {
      const stockItem = v.stock.find(s => s.itemName.toLowerCase() === it.name.toLowerCase() && s.availableQty > 0);
      if (stockItem) {
        covered += 1;
        cost += stockItem.price * (it.quantity || 1);
        available.push({ name: it.name, quantity: it.quantity || 1, price: stockItem.price, vendorId: v._id });
      } else {
        missing.push({ name: it.name });
      }
    });

    const coveragePct = items.length ? Math.round((covered / items.length) * 100) : 0;
    const dist = distanceKm(Number(lat), Number(lng), v.location.coordinates[1], v.location.coordinates[0]);

    return {
      vendor: {
        id: v._id,
        shopName: v.shopName,
        distanceKm: Number(dist.toFixed(2))
      },
      coveragePct,
      totalCost: Number(cost.toFixed(2)),
      available,
      missing
    };
  });

  // Determine tags
  let nearestId = null, cheapestId = null, bestCoverageId = null;
  if (results.length) {
    nearestId = results.reduce((a, b) => a.vendor.distanceKm < b.vendor.distanceKm ? a : b).vendor.id;
    cheapestId = results.reduce((a, b) => a.totalCost < b.totalCost ? a : b).vendor.id;
    bestCoverageId = results.reduce((a, b) => a.coveragePct > b.coveragePct ? a : b).vendor.id;
  }

  const final = results.map(r => ({
    ...r,
    tags: [
      r.vendor.id.toString() === nearestId?.toString() ? "Nearest" : null,
      r.vendor.id.toString() === cheapestId?.toString() ? "Cheapest" : null,
      r.vendor.id.toString() === bestCoverageId?.toString() ? "Best Coverage" : null
    ].filter(Boolean)
  }));

  res.json(final.sort((a,b) => b.coveragePct - a.coveragePct || a.totalCost - b.totalCost));
});

export default router;
