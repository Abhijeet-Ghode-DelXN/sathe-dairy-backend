import mongooseConnection from "@/lib/mongodb";
import Warehouse from "@/models/warehouse";
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await mongooseConnection();
    // Await to get the request body as JSON
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

    // Construct the Warehouse object with the userId from the decoded token
    const newWarehouse = new Warehouse({
      userId: userId, // Optionally include the userId if required
      ...body
    });

    // Save the new warehouse
    const result = await newWarehouse.save();

    // Return a success response with the created warehouse data
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create Warehouse" }, { status: 500 });
  }
}
