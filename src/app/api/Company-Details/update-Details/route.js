import mongooseConnection from "@/lib/mongodb";
import Company from "../../../../models/Companydetails";


export const PATCH = async (req, res) => {
  try {
    await mongooseConnection();
    const data = await req.json();
    
    // Validate required fields
    if (!data.name || !data.email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find the only company document
    const existingCompany = await Company.findOne();
    if (!existingCompany) {
      return new Response(JSON.stringify({ error: "No company found to update" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update fields dynamically
    Object.assign(existingCompany, data);
    existingCompany.updated_at = new Date();
    
    await existingCompany.save();

    return new Response(JSON.stringify(existingCompany), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Update company error:", error);
    return new Response(JSON.stringify({ error: "Failed to update company details" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
