import { Product } from "@/models/products";
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const token = request.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      console.error("Error: Authorization token is missing");
      return NextResponse.json(
        { error: "Authorization token is missing" },
        { status: 401 }
      );
    }

    // Debugging: Log JWT Secret
    if (!process.env.JWT_SECRET) {
      console.error("Error: JWT_SECRET is not set in environment variables");
      return NextResponse.json(
        { error: "Internal server error: JWT secret is missing" },
        { status: 500 }
      );
    } else {
      console.log("JWT Secret is set (Not logging the actual value for security)");
    }

    // Debugging: Log received token
    console.log("Received Token:", token);

    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
      console.log("Decoded Token:", decoded);
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const userId = decoded.userId;

    // Debugging: Check userId
    if (!userId) {
      console.error("Error: User ID missing in token payload");
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    // Check if product with the same productCode already exists
    const existingProduct = await Product.findOne({ productCode: body.productCode });
    if (existingProduct) {
      console.error(`Error: Product with code ${body.productCode} already exists.`);
      return NextResponse.json(
        { error: `Product with code ${body.productCode} already exists.` },
        { status: 409 }
      );
    }

    // Construct the product object
    const newProduct = new Product({
      userId,
      ...body,
    });

    // Save the product to the database
    const result = await newProduct.save();
    console.log("Product created successfully:", result);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Unexpected error while creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
