import { verify } from "jsonwebtoken";
import { TransportDetails } from "@/models/transport";
import { Outward } from "@/models/outward";
import { Inward } from "@/models/inward";
import { NextResponse } from "next/server";
import mongooseConnection from "@/lib/mongodb";

export async function POST(request) {
  try {
    await mongooseConnection();
    const body = await request.json();
    console.log("Request Body:", body);

    // Extract and verify token
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is missing" },
        { status: 401 }
      );
    }
    const decoded = verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    // Validate transactionType and transactionId
    const { transactionType, transactionId, ...transportData } = body;
    if (!["Inward", "Outward"].includes(transactionType)) {
      console.log("Invalid Transaction Type:", transactionType);
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    // Check for existing transaction only if transactionId is provided
    const TransactionModel = transactionType === "Outward" ? Outward : Inward;
    let transactionExists = transactionId ? await TransactionModel.findById(transactionId) : null;

    // Create a new transaction if not found and transactionId is provided
    if (!transactionExists && transactionId) {
      const newTransaction = transactionType === "Outward" 
        ? new Outward({
            // Example fields for Outward transaction (replace with actual fields)
            transactionDetails: "Outward transaction details",
            createdBy: decoded.userId,
            createdAt: new Date(),
          })
        : new Inward({
            // Example fields for Inward transaction (replace with actual fields)
            transactionDetails: "Inward transaction details",
            createdBy: decoded.userId,
            createdAt: new Date(),
          });
      await newTransaction.save();
      transactionExists = newTransaction;
    }

    // Create and save transport details
    const transportDetails = new TransportDetails({
      ...transportData,
      transactionType,
      transactionId: transactionExists ? transactionExists._id : null,
      userId: decoded.userId,  // Add userId here
    });
    console.log("Saving Transport Details:", transportDetails);

    const result = await transportDetails.save();
    console.log("Transport Details Saved:", result);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Stack Trace:", error.stack);
    return NextResponse.json(
      { error: "Failed to add transport details" },
      { status: 500 }
    );
  }
}
