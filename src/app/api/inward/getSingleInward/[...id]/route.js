// import Inward from "@/models/Inward";
import { NextResponse } from "next/server";

import { Inward } from "@/models/inward";
export async function GET(req, { params }) {
  const { id } = await params; // `id` will be an array in a catch-all route
  const InwardId = Array.isArray(id) ? id[0] : id; // Extract the first segment
  console.log("Inward ID:", InwardId); // Log to confirm extraction

  try {
    // Validate the ID format
    if (!InwardId || InwardId.length !== 24) {
      return NextResponse.json({ message: "Invalid Inward ID" }, { status: 400 });
    }

    const user = await Inward.findById(InwardId).select("-password -refreshToken");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching Inward:", error.message);
    return NextResponse.json({ error: "Failed to fetch Inward" }, { status: 500 });
  }
}
