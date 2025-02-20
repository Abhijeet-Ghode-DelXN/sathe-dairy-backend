// File: app/api/product/addProduct/route.js
import { Product } from "@/models/products";
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

// Helper function to validate product data
const validateProductData = (data) => {
  const requiredFields = ['productCode', 'name', 'price'];
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
};

export async function POST(request) {
  try {
    // Get and validate the token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Invalid authorization header format" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Verify token with explicit error handling
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT Verification failed:', jwtError.message);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    try {
      validateProductData(body);
    } catch (validationError) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      );
    }

    // Check for duplicate product
    const existingProduct = await Product.findOne({ 
      productCode: body.productCode 
    }).exec();
    
    if (existingProduct) {
      return NextResponse.json(
        { error: `Product with code ${body.productCode} already exists` },
        { status: 409 }
      );
    }

    // Create and save the new product
    const newProduct = new Product({
      userId: decoded.userId,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedProduct = await newProduct.save();

    // Return success response
    return NextResponse.json(
      { 
        message: "Product created successfully",
        product: savedProduct 
      }, 
      { status: 201 }
    );

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}