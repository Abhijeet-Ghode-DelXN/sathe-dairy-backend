import { Product } from "@/models/products";
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    // Get the authorization token from the headers
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is missing" },
        { status: 401 }
      );
    }

    // Ensure JWT secret exists
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: "Internal server error: JWT secret is missing" },
        { status: 500 }
      );
    }

    // Verify the token and extract userId
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = decoded?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token: User ID missing" },
        { status: 401 }
      );
    }

    // Check if a product with the same productCode already exists
    try {
      const existingProduct = await Product.findOne({ productCode: body.productCode });
      if (existingProduct) {
        return NextResponse.json(
          { error: `Product with code ${body.productCode} already exists.` },
          { status: 409 }
        );
      }
    } catch (dbError) {
      return NextResponse.json(
        { error: "Database error while checking existing product", details: dbError.message },
        { status: 500 }
      );
    }

    // Construct and save the new product
    try {
      const newProduct = new Product({
        userId,
        ...body,
      });

      const result = await newProduct.save();
      return NextResponse.json(result, { status: 201 });
    } catch (saveError) {
      return NextResponse.json(
        { error: "Database error while saving product", details: saveError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected error", details: error.message },
      { status: 500 }
    );
  }
}
