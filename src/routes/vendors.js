import express from "express";
import Vendor from "../models/Vendor.js";
import Item from "../models/Item.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Haversine Distance Function
function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Search vendors for a shopping list
router.get("/search", auth, async (req, res) => {
  const { lat, lng, listId } = req.query;
  if (!lat || !lng || !listId)
    return res.status(400).json({ error: "lat, lng, listId required" });

  const items = await Item.find({ listId });
  const vendors = await Vendor.find({});

  const results = vendors.map((v) => {
    let covered = 0;
    let cost = 0;
    const missing = [];
    const available = [];

    items.forEach((it) => {
      const stockItem = v.stock.find(
        (s) =>
          s.itemName.toLowerCase() === it.name.toLowerCase() &&
          s.availableQty > 0
      );

      if (stockItem) {
        covered++;
        cost += stockItem.price * (it.quantity || 1);
        available.push({
          name: it.name,
          quantity: it.quantity || 1,
          price: stockItem.price,
          vendorId: v._id,
        });
      } else {
        missing.push({ name: it.name });
      }
    });

    const coveragePct = items.length
      ? Math.round((covered / items.length) * 100)
      : 0;

    const dist = distanceKm(
      Number(lat),
      Number(lng),
      v.location.coordinates[1],
      v.location.coordinates[0]
    );

    return {
      vendor: {
        id: v._id,
        shopName: v.shopName,
        distanceKm: Number(dist.toFixed(2)),
      },
      coveragePct,
      totalCost: Number(cost.toFixed(2)),
      available,
      missing,
    };
  });

  // Determine tags (nearest / cheapest / best coverage)
  let nearestId = null,
    cheapestId = null,
    bestCoverageId = null;

  if (results.length) {
    nearestId = results.reduce((a, b) =>
      a.vendor.distanceKm < b.vendor.distanceKm ? a : b
    ).vendor.id;

    cheapestId = results.reduce((a, b) => (a.totalCost < b.totalCost ? a : b))
      .vendor.id;

    bestCoverageId = results.reduce((a, b) =>
      a.coveragePct > b.coveragePct ? a : b
    ).vendor.id;
  }

  // Add tags
  const final = results.map((r) => ({
    ...r,
    tags: [
      r.vendor.id.toString() === nearestId?.toString() ? "Nearest" : null,
      r.vendor.id.toString() === cheapestId?.toString() ? "Cheapest" : null,
      r.vendor.id.toString() === bestCoverageId?.toString()
        ? "Best Coverage"
        : null,
    ].filter(Boolean),
  }));

  // ⭐ Ranking rules
  function rank(v) {
    const isBestCoverage = v.tags.includes("Best Coverage");
    const isNearest = v.tags.includes("Nearest");

    if (isBestCoverage && isNearest) return 1; // 🥇 BEST coverage + nearest
    if (isBestCoverage) return 2; // 🥈 Best coverage only
    return 3; // 🥉 All others
  }

  // ⭐ Final sorting
  const sorted = final.sort((a, b) => {
    const rankA = rank(a);
    const rankB = rank(b);

    if (rankA !== rankB) return rankA - rankB;

    // fallback sorting inside same rank
    return (
      b.coveragePct - a.coveragePct || // better coverage first
      a.totalCost - b.totalCost || // cheaper first
      a.vendor.distanceKm - b.vendor.distanceKm // nearer first
    );
  });

  res.json(sorted);
});

export default router;
