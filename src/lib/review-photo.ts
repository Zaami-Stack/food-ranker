import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const REVIEW_PHOTO_BUCKET = "food-photos";
const MAX_REVIEW_PHOTO_BYTES = 5 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const TYPE_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export class ReviewPhotoError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ReviewPhotoError";
  }
}

function resolveFileExtension(file: File): string {
  const byType = TYPE_TO_EXTENSION[file.type.toLowerCase()];
  if (byType) {
    return byType;
  }

  const nameParts = file.name.split(".");
  const rawExtension = nameParts[nameParts.length - 1]?.toLowerCase() ?? "";
  if (/^[a-z0-9]{2,5}$/.test(rawExtension)) {
    return rawExtension;
  }

  return "jpg";
}

function validateReviewPhoto(file: File) {
  if (file.size <= 0) {
    throw new ReviewPhotoError("Photo file is empty.", 422);
  }

  if (file.size > MAX_REVIEW_PHOTO_BYTES) {
    throw new ReviewPhotoError("Photo must be 5MB or smaller.", 422);
  }

  const contentType = file.type.toLowerCase();
  if (!ALLOWED_PHOTO_TYPES.has(contentType)) {
    throw new ReviewPhotoError("Photo format must be JPG, PNG, WEBP, HEIC, or HEIF.", 422);
  }
}

export async function uploadReviewPhoto(file: File): Promise<string> {
  validateReviewPhoto(file);

  const supabase = getSupabaseAdminClient();
  const extension = resolveFileExtension(file);
  const dayPrefix = new Date().toISOString().slice(0, 10);
  const objectPath = `${dayPrefix}/${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(REVIEW_PHOTO_BUCKET).upload(objectPath, buffer, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });

  if (uploadError) {
    throw new ReviewPhotoError("Could not upload photo right now. Try again.", 500);
  }

  const { data } = supabase.storage.from(REVIEW_PHOTO_BUCKET).getPublicUrl(objectPath);
  if (!data.publicUrl) {
    throw new ReviewPhotoError("Uploaded photo URL could not be generated.", 500);
  }

  return data.publicUrl;
}
