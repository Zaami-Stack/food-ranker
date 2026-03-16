import { z } from "zod";

const hasNoControlCharacters = (value: string) => !/[\u0000-\u001F\u007F]/.test(value);

const cleanString = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} is required.` })
    .trim()
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`)
    .refine(hasNoControlCharacters, `${label} contains invalid control characters.`);

const optionalCleanString = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)
    .refine((value) => hasNoControlCharacters(value), `${label} contains invalid control characters.`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .url(`${label} must be a valid URL.`)
    .max(2048, `${label} must be at most 2048 characters.`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

export const placeInputSchema = z.object({
  name: cleanString(2, 80, "Place name"),
  location: cleanString(2, 120, "Location"),
  cuisine: optionalCleanString(50, "Cuisine"),
  addedBy: cleanString(2, 40, "Your name"),
});

export const reviewInputSchema = z.object({
  placeId: z.string().uuid("A valid place is required."),
  foodName: cleanString(2, 80, "Food name"),
  rating: z.coerce.number().int().min(1, "Rating must be between 1 and 5.").max(5, "Rating must be between 1 and 5."),
  comment: optionalCleanString(280, "Comment"),
  imageUrl: optionalUrl("Photo URL"),
  reviewerName: cleanString(2, 40, "Reviewer name"),
});

export const foodEntryInputSchema = z.object({
  foodName: cleanString(2, 80, "Food name"),
  sourcePlace: cleanString(2, 120, "Where you got it"),
  imageUrl: optionalUrl("Photo URL"),
  saadRating: z.coerce.number().int().min(1, "Saad rating must be between 1 and 5.").max(5, "Saad rating must be between 1 and 5."),
  anasRating: z.coerce.number().int().min(1, "Anas rating must be between 1 and 5.").max(5, "Anas rating must be between 1 and 5."),
});

const ratingNumberSchema = z.coerce.number().int().min(1, "Rating must be between 1 and 5.").max(5, "Rating must be between 1 and 5.");

export const foodEntryRatingsUpdateSchema = z
  .object({
    saadRating: ratingNumberSchema.optional(),
    anasRating: ratingNumberSchema.optional(),
  })
  .refine((value) => value.saadRating !== undefined || value.anasRating !== undefined, {
    message: "At least one rating is required.",
    path: ["saadRating"],
  });

export const placeIdParamsSchema = z.object({
  placeId: z.string().uuid("Invalid place id."),
});

export const foodEntryIdParamsSchema = z.object({
  entryId: z.string().uuid("Invalid food entry id."),
});

export type PlaceInput = z.infer<typeof placeInputSchema>;
export type ReviewInput = z.infer<typeof reviewInputSchema>;
export type FoodEntryInput = z.infer<typeof foodEntryInputSchema>;
export type FoodEntryRatingsUpdateInput = z.infer<typeof foodEntryRatingsUpdateSchema>;
