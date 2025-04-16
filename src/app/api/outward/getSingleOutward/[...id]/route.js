// import Outward from "@/models/Outward";
import { NextResponse } from "next/server";

import { Outward } from "@/models/outward";
export async function GET(req, { params }) {
  const { id } = await params; // `id` will be an array in a catch-all route
  const OutwardId = Array.isArray(id) ? id[0] : id; // Extract the first segment
  console.log("Outward ID:", OutwardId); // Log to confirm extraction

  try {
    // Validate the ID format
    if (!OutwardId || OutwardId.length !== 24) {
      return NextResponse.json({ message: "Invalid Outward ID" }, { status: 400 });
    }

    const user = await Outward.findById(OutwardId).select("-password -refreshToken");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching Outward:", error.message);
    return NextResponse.json({ error: "Failed to fetch Outward" }, { status: 500 });
  }
}
