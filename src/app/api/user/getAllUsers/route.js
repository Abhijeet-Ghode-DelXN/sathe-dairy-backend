import { User } from "@/models/user";
import { NextResponse } from "next/server";
import mongooseConnection from "@/lib/mongodb";
export async function GET() {
  try {
     // Ensure the database is connected
     await mongooseConnection();
    // Fetch all Users from the database
    const users = await User.find({}); // Using `{}` ensures all users are fetched

    // Return the fetched Users as a JSON response
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error.message);

    // Return a server error response
    return NextResponse.json(
      { error: "Failed to fetch users. Please try again." },
      { status: 500 }
    );
  }
}
