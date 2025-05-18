import { Product } from "@/models/products";
import { NextResponse } from "next/server";
import mongooseConnection from "@/lib/mongodb";
import { Category } from "@/models/categories";

export async function GET(request) {
  try {
    // Ensure the database is connected
    await mongooseConnection();
    
    // Get page and limit from query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;
    
    // Fetch products with pagination and category population
    const products = await Product.find({})
      .populate({
        path: 'category',
        model: Category,
        select: 'categoryName'
      })
      .skip(skip)
      .limit(limit)
      .lean(); // Using lean() for better performance
    
    // Transform products to replace category ObjectId with categoryName
    const transformedProducts = products.map(product => {
      // If category is populated and has categoryName, use it; otherwise keep as is
      if (product.category && typeof product.category === 'object' && product.category.categoryName) {
        return {
          ...product,
          categoryName: product.category.categoryName,
          category: product.category.categoryName // Replace category ID with name
        };
      }
      return product;
    });

    // Return the fetched Products as a JSON response
    return NextResponse.json(transformedProducts, { status: 200 });
  } catch (error) {
    console.error("Error fetching Products:", error.message);

    // Return a server error response
    return NextResponse.json(
      { error: "Failed to fetch Products. Please try again." },
      { status: 500 }
    );
  }
}
