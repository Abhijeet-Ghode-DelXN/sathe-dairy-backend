import mongoose, { Schema, model, models } from "mongoose";
const TransportDetailsSchema = new Schema({

   // User details for the outward transaction
 userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User", // Reference to the User model
  required: true,
          },
    source: { 
      type: String, 
      required: true, 
      trim: true 
    },
    destination: { 
      type: String, 
      required: true, 
      trim: true 
    },
    date: { 
      type: Date, 
      required: true 
    },
    vehicleNumber: { 
      type: String, 
      required: true, 
      match: [/^[A-Z0-9-]{5,15}$/, "Please enter a valid vehicle number"] 
    },
    rentalCost: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    vehicleType: { 
      type: String, 
      required: true, 
      trim: true 
    },
    
    // Reference to distinguish whether it's for outward or inward
    transactionType: { 
      type: String, 
      enum: ['Inward', 'Outward'], // Only Inward or Outward
      required: true,
    },
    transactionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      // required: true, 
      refPath: 'transactionType' // Dynamically links to either Inward or Outward model
    }
  });
  export const TransportDetails = models.TransportDetails || model("TransportDetails", TransportDetailsSchema);