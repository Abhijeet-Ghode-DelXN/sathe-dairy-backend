// import mongooseConnection from "@/lib/mongodb";
// import { Outward } from "@/models/outward";
// import { verify } from "jsonwebtoken";
// import { NextResponse } from "next/server";

// export async function POST(request) {
//     try {
//         mongooseConnection();
//         // Parse JSON body
//         const body = await request.json();

//         // Get the authorization token from headers
//         const token = request.headers.get('Authorization')?.split(' ')[1];
//         if (!token) {
//             return NextResponse.json(
//                 { error: 'Authorization token is missing' },
//                 { status: 401 }
//             );
//         }

//         // Verify the token and extract the userId
//         const decoded = verify(token, process.env.JWT_SECRET);
//         if (!decoded || !decoded.userId) {
//             return NextResponse.json(
//                 { error: 'Invalid or expired token' },
//                 { status: 401 }
//             );
//         }

//         const userId = decoded.userId;

//         // Attach the userId to the outward body
//         body.userId = userId;

//         // Save the outward entry to the database
//         const outward = new Outward(body);
//         const result = await outward.save();

//         // Return the saved result
//         return NextResponse.json(result, { status: 201 });
//     } catch (error) {
//         console.error(error);
//         return NextResponse.json(
//             { error: 'Failed to create Outward' },
//             { status: 500 }
//         );
//     }
// }



import mongooseConnection from "@/lib/mongodb";
import { Outward } from "@/models/outward";
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        // Connect to the database
        await mongooseConnection();

        // Parse JSON body
        const body = await request.json();

        console.log("Received body:", body);

        // Get the authorization token from headers
        const token = request.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json(
                { error: 'Authorization token is missing' },
                { status: 401 }
            );
        }

        // Verify the token and extract the userId
        let decoded;
        try {
            decoded = verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        if (!decoded?.userId) {
            return NextResponse.json(
                { error: 'Invalid token, userId missing' },
                { status: 401 }
            );
        }

        const userId = decoded.userId;
        body.userId = userId;

        // Validate required fields
        if (!body.customerDetails || !body.customerDetails.customerId) {
            return NextResponse.json(
                { error: 'Customer details are required' },
                { status: 400 }
            );
        }

        if (!body.productDetails || !Array.isArray(body.productDetails) || body.productDetails.length === 0) {
            return NextResponse.json(
                { error: 'At least one product is required' },
                { status: 400 }
            );
        }

        // Create a new outward transaction
        const outward = new Outward(body);
        const result = await outward.save();

        // Return the saved result
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating Outward:", error);
        return NextResponse.json(
            { error: 'Failed to create Outward', details: error.message },
            { status: 500 }
        );
    }
}
