// pages/api/testConnection.js
import DBConnection from '../../../lib/mongodb';

// Export a named function for the GET request
export async function GET(req) {
    try {
      // Call the DBConnection function to ensure the connection is established
      const db = await DBConnection();
      
      return new Response(
        JSON.stringify({ message: 'Database connection successful' }),
        { status: 200 }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ message: 'Database connection failed', error: error.message }),
        { status: 500 }
      );
    }
  }