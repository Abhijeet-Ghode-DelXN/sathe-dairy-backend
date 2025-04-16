import mongoose, { model, models } from "mongoose";

const warehouseSchema = new mongoose.Schema(
  {
     // User details for the outward transaction
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User", // Reference to the User model
              required: true,
            },
    warehouseName: {
      type: String,
      required: true,
      unique: true, // To ensure each warehouse has a unique name
    },
    warehouseLocation: {
      type: String,
      required: true,
    },
    warehouseCapacity: {
      type: Number,
      required: true, // Capacity of storage in some unit (e.g., cubic meters or number of pallets)
    },
    managerName: {
      type: String,
      required: true,
    },
    managerContact: {
      type: String,
      required: true,
      match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'], // Assuming the contact number is a 10-digit phone number
    },
  },
  { timestamps: true }
);

// const Warehouse = mongoose.model("Warehouse", warehouseSchema);
export const Warehouse = models.Warehouse || model('Warehouse', warehouseSchema);

export default Warehouse;
