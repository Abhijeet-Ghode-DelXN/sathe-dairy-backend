// import TransportDetails from "@/models/TransportDetails";
import { NextResponse } from "next/server";
import { TransportDetails } from "@/models/transport";

export async function GET(req, { params }) {
  const { id } = await params; // `id` will be an array in a catch-all route
  const TransportDetailsId = Array.isArray(id) ? id[0] : id; // Extract the first segment
  console.log("transpot ID:", TransportDetailsId); // Log to confirm extraction

  try {
    await mongooseConnection();
    // Validate the ID format
    if (!TransportDetailsId || TransportDetailsId.length !== 24) {
      return NextResponse.json({ message: "Invalid TransportDetails ID" }, { status: 400 });
    }

    const user = await TransportDetails.findById(TransportDetailsId).select("-password -refreshToken");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching TransportDetails:", error.message);
    return NextResponse.json({ error: "Failed to fetch TransportDetails" }, { status: 500 });
  }
}
