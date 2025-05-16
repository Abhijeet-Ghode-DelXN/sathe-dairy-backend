import mongoose, { Schema, model, models } from "mongoose";
import supplier from "./Suppliers";

const InwardSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    supplierDetails: {
      supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
        // required: true,
      },
      supplierName: {
        type: String,
        // required: true,
        trim: true,
      },
      supplierMobileNo: {
        type: String,
        // required: true,
        match: [/^\d{10}$/, "Please enter a valid contact number"],
      },
      supplierEmailId: {
        type: String,
        // required: true,
      },
      supplierGSTNo: {
        type: String,
        // required: true,
      },
      supplierAddress: {
        type: String,
        // required: true,
        // trim: true,
      },
    },
    category: {
      type: String,
      required: true,
      // enum: ["Raw Milk", "Processed Goods", "Packaging", "Other"],
      trim: true,
    },
    warehouse: {
      type: String,
      required: true,
      trim: true,
    },
    transportDetails: {
      vehicleNumber: {
        type: String,
        required: true,
        match: [/^[A-Z0-9-]{5,15}$/, "Please enter a valid vehicle number"],
      },
      vehicleType: {
        type: String,
        required: true,
        // enum: ["Truck", "Van", "Container", "Tanker", "Other"],
        trim: true,
      },
      driverMobileNumber: {
        type: String,
        required: true,
        match: [/^\d{10}$/, "Please enter a valid mobile number"],
      },
      vehicleTemperature: {
        type: Number,
        required: false,
      },
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // totalAmount: {
    //   type: Number,
    //   required: true,
    //   min: 0,
    // },
    invoiceNo: {
      type: String,
      // required: true,
      unique: true,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    productDetails: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 0,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      productRate: {
        type: Number,
        required: true,
        min: 0,
      },
      gstAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      gstPercentage: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      
      productCode: {
        type: String,
        required: true,
        trim: true,
      },
      bagQuantity: {
        type: Number,
        // required: true,
        min: 0,
      },
    }],
  },
  { timestamps: true }
);

// Pre-save hook for generating unique invoice number
InwardSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const latestInward = await this.constructor.findOne().sort({ createdAt: -1 });
      const invoicePrefix = "INV";
      const invoiceCounter = latestInward && latestInward.invoiceNo 
        ? parseInt(latestInward.invoiceNo.slice(3)) + 1 
        : 1;
      this.invoiceNo = `${invoicePrefix}${invoiceCounter.toString().padStart(5, "0")}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

delete mongoose.models.Inward;
export const Inward = models.Inward || model("Inward", InwardSchema);