import { Product } from "@/models/products";
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json(); // Get the request body as JSON

    // Get the authorization token from the headers
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is missing" },
        { status: 401 }
      );
    }

    // Verify the token and extract the userId
    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if a product with the same productCode already exists
    const existingProduct = await Product.findOne({ productCode: body.productCode });
    if (existingProduct) {
      return NextResponse.json(
        { error: `Product with code ${body.productCode} already exists.` },
        { status: 409 } // Use 400 for bad request in case of duplicate
      );
    }

    // Construct the product object with the userId from the decoded token
    const newProduct = new Product({
      userId, // Use the extracted userId from the token
      ...body, // Spread the rest of the fields from the request body
    });

    // Save the new product to the database
    const result = await newProduct.save();

    // Return a success response with the created product data
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
