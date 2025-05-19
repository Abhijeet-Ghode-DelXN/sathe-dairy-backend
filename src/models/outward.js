import mongoose, { Schema, model, models } from "mongoose";

// OutwardSchema defines the structure for an outward transaction in the system
const OutwardSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: { type: String, required: true, trim: true },
    amount: { type: Number,  min: 0 },
    // quantity: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentType: {
      type: String,
      enum: ["Cash", "Credit", "Online", "Cheque"],
      required: true,
    },
    outstandingPayment: { type: Number, default: 0, min: 0 },
    invoiceGenerated: { type: Boolean, default: false },

    invoiceNo: {
      type: String,
      unique: true,
      trim: true,
    },
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },

    customerDetails: {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'}, // Reference to Customer model
      name: { type: String, required: true, trim: true },
      contactNumber: {
        type: String,
        required: true,
        match: [/^\d{10}$/, "Please enter a valid contact number"],
      },
      address: { type: String, trim: true },
      customerAddress: {
        type: String,
        // required: true,
      },
      customerEmailId: {
        type: String,
        // required: true,
      },
    },

   

    productDetails: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 0 },
        name: { type: String, trim: true },
        productCode: { type: String, required: true },
        productPrice: { type: Number, min: 0 },
        gstPercentage: { type: Number, required: true, min: 0 },
        gstAmount: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
      },
    ],

    transportDetails: {
      vehicleType: { type: String, required: true },
      vehicleNumber: {
        type: String,
        required: true,
        match: [/^[A-Z0-9-]{5,15}$/, "Please enter a valid vehicle number"],
      },
      driverName: { type: String, required: true },
      driverContactNumber: { type: String, required: true },
      deliveryStatus: {
        type: String,
        enum: ["Pending", "Shipped", "Delivered"],
        default: "Pending",
      },
      transportDate: { type: Date, required: true },
      rentalCost: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate a unique invoice number
// Pre-save hook to generate a unique invoice number
OutwardSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const latestOutward = await this.constructor.findOne().sort({ createdAt: -1 });
      const invoicePrefix = "INV"; // Customize the prefix as needed
      const invoiceCounter = latestOutward && latestOutward.invoiceNo ? parseInt(latestOutward.invoiceNo.slice(3)) + 1 : 1;
      this.invoiceNo = `${invoicePrefix}${invoiceCounter.toString().padStart(5, "0")}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});




// Export the Outward model
delete mongoose.models.Outward;
export const Outward = models.Outward || model("Outward", OutwardSchema);
