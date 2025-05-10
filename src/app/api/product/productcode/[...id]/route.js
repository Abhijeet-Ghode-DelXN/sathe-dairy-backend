import { NextResponse } from 'next/server';
// import Product from '../../../models/Product'; // Adjust the path based on your project structure
import { Product } from '@/models/products';
export async function GET(request, { params }) {
  const { productCode } = params;

  try {
    const product = await Product.findOne({ code: productCode });
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Return the productId (ObjectId)
    return NextResponse.json({ productId: product._id.toString() }); // Send productId as string (not ObjectId)
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching product details', error: error.message }, { status: 500 });
  }
}
