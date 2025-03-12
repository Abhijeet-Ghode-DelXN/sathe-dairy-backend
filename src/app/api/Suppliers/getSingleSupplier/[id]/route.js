import { supplier } from "@/models/Suppliers";
import { Outward } from "@/models/outward"; // Import Outward model
import { NextResponse } from "next/server";
import mongoose from 'mongoose';
import { Product } from "@/models/products";
export async function GET(req, { params }) {
  const { id } = await params; // `id` will be an array in a catch-all route
  
  const supplierId = Array.isArray(id) ? id[0] : id; // Extract the first segment
  console.log("supplier ID:", supplierId); // Log to confirm extraction

  try {
    // Validate the ID format
    if (!supplierId || supplierId.length !== 24) {
      return NextResponse.json({ message: "Invalid supplier ID" }, { status: 400 });
    }

    // Fetch supplier details excluding sensitive fields
    const user = await supplier.findById(supplierId).select("-password -refreshToken");
    if (!user) {
      return NextResponse.json({ message: "supplier not found" }, { status: 404 });
    }

    // Fetch outward transactions related to this supplier
    const transactions = await Outward.find({
      "supplierDetails.supplierId": supplierId,
    })
      .populate("productDetails.productId", "name productCode productPrice") // Populate product details
      .exec();

    // Include transactions in the response
    const responseData = {
      supplier: user,
      transactions: transactions, // Add transactions to the response
    };
    console.log("Fetched supplier and Transactions:", responseData); // Log for debugging
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error fetching supplier and Transactions:", error.message);
    return NextResponse.json({ error: "Failed to fetch supplier and Transactions" }, { status: 500 });
  }
}
