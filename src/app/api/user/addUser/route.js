import mongooseConnection from "@/lib/mongodb";
import { User } from "@/models/user";
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await mongooseConnection();
    // Parse the request body as JSON
    const body = await request.json();

    // Get the authorization token from the headers
    const token = request.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is missing" },
        { status: 401 }
      );
    }

    // Verify the token and extract the user role
    const decoded = verify(token, process.env.JWT_SECRET);
    const userRole = decoded.role;

    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Only admins can add new users" },
        { status: 403 }
      );
    }

    // Ensure required fields are present
    const { fullName, email, password, mobileNumber, role, permissions } = body;
    if (!fullName || !email || !password || !mobileNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure the role and permissions are valid
    const validRoles = ["admin", "user"];
    const validPermissions = ["create", "update", "delete", "view"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Allowed roles: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }
    if (
      permissions &&
      permissions.some((permission) => !validPermissions.includes(permission))
    ) {
      return NextResponse.json(
        { error: `Invalid permissions. Allowed permissions: ${validPermissions.join(", ")}` },
        { status: 400 }
      );
    }

    // Create the new user
    const newUser = new User({
      fullName,
      email,
      password,
      mobileNumber,
      role: role || "user",
      permissions: permissions || ["view"],
    });

    const result = await newUser.save();

    // Return success response
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
