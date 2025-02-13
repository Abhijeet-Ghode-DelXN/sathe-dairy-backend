import mongooseConnection from "@/lib/mongodb";
import Customer from "@/models/customers";
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    mongooseConnection()
    // Parse the request body as JSON
    const body = await request.json();

    // Get the authorization token from the headers
    const token = request.headers.get('Authorization')?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is missing" },
        { status: 401 }
      );
    }

    // Verify the token and extract the userId
    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Construct the Customer object with the userId from the decoded token
    const newCustomer = new Customer({
      userId: userId,
      ...body
    });

    // Save the new customer
    const result = await newCustomer.save();

    // Return a success response with the created customer data
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create Customer" }, { status: 500 });
  }
}
