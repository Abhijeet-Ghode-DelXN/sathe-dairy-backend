import mongooseConnection from "@/lib/mongodb";
import { User } from "@/models/user";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id } = await params; // `id` will be an array in a catch-all route
  const userId = Array.isArray(id) ? id[0] : id; // Extract the first segment
  console.log("User ID:", userId); // Log to confirm extraction

  try {
    await mongooseConnection();
    // Validate the ID format
    if (!userId || userId.length !== 24) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error.message);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
