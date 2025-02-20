import mongooseConnection from "@/lib/mongodb";
import { Product } from "@/models/products";
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

// Define allowed origins (or use "*" for public access)
const allowedOrigins = ["*"]; // Use "*" for public access or specify domains

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigins.join(","),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

export async function POST(request) {
  try {
    mongooseConnection();
    const body = await request.json();

    // CORS Headers
    const headers = {
      "Access-Control-Allow-Origin": allowedOrigins.join(","),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Get authorization token
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is missing" },
        { status: 401, headers }
      );
    }

    // Verify token
    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if product already exists
    const existingProduct = await Product.findOne({ productCode: body.productCode });
    if (existingProduct) {
      return NextResponse.json(
        { error: `Product with code ${body.productCode} already exists.` },
        { status: 409, headers }
      );
    }

    // Create new product
    const newProduct = new Product({ userId, ...body });
    const result = await newProduct.save();

    // Return success response
    return NextResponse.json(result, { status: 201, headers });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500, headers: { "Access-Control-Allow-Origin": allowedOrigins.join(",") } }
    );
  }
}
