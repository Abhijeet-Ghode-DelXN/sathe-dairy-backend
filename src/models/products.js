import mongoose, { Schema, model, models } from "mongoose";

const ProductSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productDescription: {
      type: String,
      trim: true,
      default: '',
    },
    productPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    productCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,  // Changed to ObjectId to match frontend
      ref: 'Category',
      required: true,
    },
    sellingPrice: {
      type: Number,
      // required: true,
      // min: 0,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    configuration: {
      numberOfPieces: {
        type: Number,
        default: 0,
        min: 0,
      },
      numberOfBags: {
        type: Number,
        required: true,
        min: 0,
      },
      skuQuantity: {
        type: Number,
        required: true,
        // min: 0,
        default: 0,
      },
      GST: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual fields
ProductSchema.virtual("totalCost").get(function () {
  return this.sellingPrice * this.quantity;
});

ProductSchema.virtual("totalPieces").get(function () {
  return (this.configuration.numberOfPieces || 0) * this.configuration.skuQuantity;
});

ProductSchema.virtual("totalBags").get(function () {
  return this.configuration.numberOfBags * this.configuration.skuQuantity;
});

// Clear existing model to prevent OverwriteModelError
delete mongoose.models.Product;

export const Product = models.Product || model("Product", ProductSchema);
