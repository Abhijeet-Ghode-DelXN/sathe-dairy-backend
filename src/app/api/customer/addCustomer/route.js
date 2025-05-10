import mongooseConnection from "@/lib/mongodb";
import Customer from "@/models/customers";
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await mongooseConnection();

    let body;
    try {
      const text = await request.text();
      if (!text) throw new Error("Empty request body");

      body = JSON.parse(text);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or missing JSON body" },
        { status: 400 }
      );
    }

    console.log("Received request body:", body); // Debugging log

    // Required fields validation
    const requiredFields = [
      "customerName",
      "customerMobileNo",
      "customerAddress"
    ];

    // Check for missing fields
    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Get the authorization token from the headers
    const token = request.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is missing" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Create new customer
    const newCustomer = new Customer({
      userId,
      ...body,
    });

    const result = await newCustomer.save();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: `Failed to create Customer: ${error.message}` },
      { status: 500 }
    );
  }
}
