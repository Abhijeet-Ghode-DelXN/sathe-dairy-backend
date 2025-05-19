import mongooseConnection from "@/lib/mongodb";
import Warehouse from "@/models/warehouse";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  await mongooseConnection();
  const { id } = await params; // `id` will be an array in a catch-all route
  const WarehouseId = Array.isArray(id) ? id[0] : id; // Extract the first segment
  console.log("User ID:", WarehouseId); // Log to confirm extraction

  try {
    // Validate the ID format
    if (!WarehouseId || WarehouseId.length !== 24) {
      return NextResponse.json({ message: "Invalid Warehouse ID" }, { status: 400 });
    }

    const user = await Warehouse.findById(WarehouseId).select("-password -refreshToken");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching Warehouse:", error.message);
    return NextResponse.json({ error: "Failed to fetch Warehouse" }, { status: 500 });
  }
}
