import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import {User} from '@/models/user'; // Import your User model (adjust to your actual path)
import mongooseConnection from '@/lib/mongodb'
// Middleware to verify JWT token and extract userId
const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject('Unauthorized');
      } else {
        resolve(decoded);
      }
    });
  });
};

// GET handler to fetch user profile
export const GET = async (req) => {
  const authorization = req.headers.get('Authorization');
  if (!authorization) {
    return NextResponse.json({ message: 'Token required' }, { status: 403 });
  }

  try {
   await mongooseConnection()
    const token = authorization.split(' ')[1]; // Get the token from the 'Authorization' header
    const decoded = await verifyToken(token); // Verify the token and extract userId
    const userId = decoded.userId;

    // Fetch the user from the database
    const user = await User.findById(userId); // Assuming the user ID is stored in the token
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Send the user profile (excluding sensitive information like password)
    return NextResponse.json({
      name: user.name,
      email: user.email,
      // Include any other profile data you want to return
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
