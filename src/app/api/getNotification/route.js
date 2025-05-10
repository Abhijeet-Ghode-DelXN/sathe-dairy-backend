import { User } from "@/models/user";
import mongooseConnection from "@/lib/mongodb"; // Ensure you have a DB connection utility

export async function GET(req) {
  await mongooseConnection();

  try {
    const admin = await User.findOne({ role: "admin" }).select("notifications");

    if (!admin) {
      return Response.json({ success: false, message: "No admin found" }, { status: 404 });
    }
    
    return Response.json({ success: true, notifications: admin.notifications || [] }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return Response.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
