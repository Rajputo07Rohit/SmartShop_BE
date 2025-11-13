import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Vendor from "../models/Vendor.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shopping_list_project";
const file = path.join(process.cwd(), "src/seed/vendors.json");

async function run() {
  await mongoose.connect(MONGO_URI, { dbName: MONGO_URI.split('/').pop() });
  const vendors = JSON.parse(fs.readFileSync(file, "utf-8"));
  await Vendor.deleteMany({});
  await Vendor.insertMany(vendors);
  console.log("✅ Seeded vendors:", vendors.length);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
