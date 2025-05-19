import { Customer } from "@/models/customers";
import { Outward } from "@/models/outward"; // Import Outward model
import { NextResponse } from "next/server";
import mongoose from 'mongoose';
import { Product } from "@/models/products";
import mongooseConnection from "@/lib/mongodb";
export async function GET(req, { params }) {
  const { id } = await params; // `id` will be an array in a catch-all route
  
  const CustomerId = Array.isArray(id) ? id[0] : id; // Extract the first segment
  console.log("Customer ID:", CustomerId); // Log to confirm extraction

  try {
    await mongooseConnection();
    // Validate the ID format
    if (!CustomerId || CustomerId.length !== 24) {
      return NextResponse.json({ message: "Invalid Customer ID" }, { status: 400 });
    }

    // Fetch customer details excluding sensitive fields
    const user = await Customer.findById(CustomerId).select("-password -refreshToken");
    if (!user) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    // Fetch outward transactions related to this customer
    const transactions = await Outward.find({
      "customerDetails.customerId": CustomerId,
    })
      .populate("productDetails.productId", "name productCode productPrice") // Populate product details
      .exec();

    // Include transactions in the response
    const responseData = {
      customer: user,
      transactions: transactions, // Add transactions to the response
    };
    console.log("Fetched Customer and Transactions:", responseData); // Log for debugging
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error fetching Customer and Transactions:", error.message);
    return NextResponse.json({ error: "Failed to fetch Customer and Transactions" }, { status: 500 });
  }
}
