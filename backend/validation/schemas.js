import { z } from "zod";
import {
  roles,
  districts,
  categories,
  methods,
  qualities,
  units,
  availability,
  statuses,
} from "../utils/constants.js";
export const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid resource ID.");
const text = (max = 120) => z.string().trim().min(1).max(max);
export const phone = z
  .string()
  .regex(/^(?:0|\+94)7\d{8}$/, "Use a Sri Lankan mobile number.");
export const address = z
  .object({
    label: text(40).optional(),
    recipientName: text(),
    phone,
    addressLine: text(300),
    district: z.enum(districts),
    city: text(),
    isDefault: z.boolean().default(false),
  })
  .strict();
export const registration = z
  .object({
    name: text(),
    email: z.string().trim().toLowerCase().email().max(254),
    phone,
    password: z
      .string()
      .min(10)
      .max(72)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/\d/)
      .regex(/[^a-zA-Z0-9]/),
    confirmPassword: z.string(),
    role: z.enum(roles),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });
export const login = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(72),
  })
  .strict();
export const farmerProfile = z
  .object({
    name: text().optional(),
    phone: phone.optional(),
    farmName: text().optional(),
    district: z.enum(districts).optional(),
    city: text().optional(),
    description: text(2000).optional(),
    farmSize: z.number().min(0).max(100000).optional(),
    mainCrops: z.array(text(60)).max(30).optional(),
    farmingMethods: z.array(z.enum(methods)).max(5).optional(),
    yearsExperience: z.number().int().min(0).max(100).optional(),
    deliveryAvailable: z.boolean().optional(),
    pickupAvailable: z.boolean().optional(),
    publicLocation: z.boolean().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .strict();
export const customerProfile = z
  .object({
    name: text().optional(),
    phone: phone.optional(),
    district: z.enum(districts).optional(),
    city: text().optional(),
    preferredProducts: z.array(text(60)).max(50).optional(),
  })
  .strict();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    "Invalid calendar date.",
  );
export const productFields = z
  .object({
    name: text(),
    category: z.enum(categories),
    description: text(3000),
    farmingMethod: z.enum(methods),
    quality: z.enum(qualities),
    harvestDate: date,
    availableDate: date,
    freshnessDate: date.optional(),
    quantity: z.number().int().min(0).max(1000000),
    unit: z.enum(units),
    price: z.number().positive().max(10000000),
    bulkPrice: z.number().min(0).max(10000000).default(0),
    minimumBulkQuantity: z.number().int().min(1).max(1000000).default(20),
    district: z.enum(districts),
    city: text(),
    location: z
      .object({
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        isPublic: z.boolean().default(false),
      })
      .strict()
      .optional(),
    deliveryAvailable: z.boolean(),
    pickupAvailable: z.boolean(),
    deliveryNotes: z.string().trim().max(1000).optional(),
    pickupInstructions: z.string().trim().max(1000).optional(),
    availabilityStatus: z.enum(availability).default("Available"),
    isPreOrder: z.boolean().default(false),
    isActive: z.boolean().default(true),
    images: z
      .array(
        z
          .object({ publicId: text(255), url: z.string().url().optional() })
          .strict(),
      )
      .max(5)
      .default([]),
  })
  .strict();
export const productRelations = (value, ctx) => {
  if (
    value.availableDate < value.harvestDate ||
    (value.freshnessDate && value.freshnessDate < value.availableDate)
  )
    ctx.addIssue({
      code: "custom",
      message: "Dates must follow harvest, availability, then freshness order.",
      path: ["availableDate"],
    });
  if (value.bulkPrice && value.bulkPrice >= value.price)
    ctx.addIssue({
      code: "custom",
      message: "Bulk price must be below regular price.",
      path: ["bulkPrice"],
    });
  if (!value.deliveryAvailable && !value.pickupAvailable)
    ctx.addIssue({
      code: "custom",
      message: "Enable delivery or pickup.",
      path: ["deliveryAvailable"],
    });
};
export const productCreate = productFields.superRefine(productRelations);
export const productUpdate = productFields.partial();
export const page = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});
const booleanQuery = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();
export const productQuery = page
  .extend({
    search: z.string().trim().max(100).optional(),
    category: z.enum(categories).optional(),
    district: z.enum(districts).optional(),
    city: text().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    farmingMethod: z.enum(methods).optional(),
    quality: z.enum(qualities).optional(),
    availability: z.enum(availability).optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    deliveryAvailable: booleanQuery,
    pickupAvailable: booleanQuery,
    sort: z
      .enum(["latest", "price_asc", "price_desc", "rating", "popular"])
      .default("latest"),
  })
  .strict();
export const cartInput = z
  .object({ productId: id, quantity: z.number().int().min(1).max(1000000) })
  .strict();
export const cartQuantity = cartInput.pick({ quantity: true });
export const checkout = z
  .object({
    fulfillmentMethod: z.enum(["delivery", "pickup"]),
    paymentMethod: z.enum(["cash_on_delivery", "pay_on_pickup"]),
    deliveryAddress: address.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      (data.fulfillmentMethod === "delivery" &&
        (!data.deliveryAddress || data.paymentMethod !== "cash_on_delivery")) ||
      (data.fulfillmentMethod === "pickup" &&
        data.paymentMethod !== "pay_on_pickup")
    )
      ctx.addIssue({
        code: "custom",
        message: "Payment and address must match fulfillment.",
        path: ["paymentMethod"],
      });
  });
export const statusInput = z.object({ status: z.enum(statuses) }).strict();
export const orderQuery = page
  .extend({
    status: z
      .enum(["active", "completed", "cancelled", ...statuses])
      .optional(),
  })
  .strict();
export const reviewInput = z
  .object({
    orderId: id,
    productId: id,
    rating: z.number().int().min(1).max(5),
    comment: text(1500),
  })
  .strict();
export const aiInput = z
  .object({
    product: text(),
    category: z.enum(categories),
    district: z.enum(districts),
    quality: z.enum(qualities),
    quantity: z.number().positive().max(1000000),
    unit: z.enum(units),
    harvestDate: date,
    month: z.number().int().min(1).max(12),
  })
  .strict()
  .refine((data) => Number(data.harvestDate.slice(5, 7)) === data.month, {
    path: ["month"],
    message: "Month must match harvest date.",
  });
export const priceQuery = page
  .extend({
    product: text().optional(),
    district: z.enum(districts).optional(),
    unit: z.enum(units).optional(),
    period: z.coerce.number().int().min(1).max(365).default(30),
  })
  .strict();
