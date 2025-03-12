
import mongooseConnection from "@/lib/mongodb";
import Company from "../../../models/Companydetails";

// Named exports for HTTP methods
export const GET = async (req, res) => {
  try {
    await mongooseConnection();
    const companies = await Company.find({});
    return new Response(JSON.stringify(companies), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch companies" }), { 
      status: 500 
    });
  }
};

export const POST = async (req, res) => {
  const data = await req.json();

  if (!data.name || !data.email) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { 
      status: 400 
    });
  }

  try {
    await mongooseConnection();

    // Check if any company exists
    const existingCompany = await Company.findOne();
    if (existingCompany) {
      return new Response(JSON.stringify({ error: "A company already exists. Only one entry is allowed." }), { 
        status: 409 
      });
    }

    const newCompany = new Company(data);
    await newCompany.save();

    return new Response(JSON.stringify(newCompany), { 
      status: 201 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to create company" }), { 
      status: 500 
    });
  }
};
