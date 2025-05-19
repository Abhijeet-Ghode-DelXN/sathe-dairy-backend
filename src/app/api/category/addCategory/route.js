import mongooseConnection from "@/lib/mongodb";
import Category from "@/models/categories";
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

    // Construct the Category object with the userId from the decoded token
    const newCategory = new Category({
      userId: userId,
      ...body
    });

    // Save the new category
    const result = await newCategory.save();

    // Return a success response with the created category data
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create Category" }, { status: 500 });
  }
}
