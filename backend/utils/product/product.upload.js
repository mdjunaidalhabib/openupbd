import { cloudinary } from "../cloudinary/index.js";
import fs from "fs";
import streamifier from "streamifier";

const MAX_BYTES = 60 * 1024;
const MAX_DIM = 1000;

const getTransformIfNeeded = (sizeBytes) => {
  if (!sizeBytes || sizeBytes <= MAX_BYTES) return undefined;

  return [
    { width: MAX_DIM, height: MAX_DIM, crop: "limit" },
    { format: "webp", quality: "auto:good" },
  ];
};

// ✅ Optimized delivery URL builder (no extra storage, just URL transform)
const makeOptimizedUrl = (publicId) => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { width: MAX_DIM, height: MAX_DIM, crop: "limit" },
      { fetch_format: "webp", quality: "auto:good" },
    ],
  });
};

export const uploadToCloudinary = async (file, folder) => {
  if (!file) throw new Error("No file provided");

  const sizeBytes = file.size;
  const transformation = getTransformIfNeeded(sizeBytes);

  // 1) memoryStorage
  if (file?.buffer) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          ...(transformation ? { transformation } : {}),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      streamifier.createReadStream(file.buffer).pipe(stream);
    });

    return {
      ...result,
      optimizedUrl:
        sizeBytes > MAX_BYTES
          ? makeOptimizedUrl(result.public_id)
          : result.secure_url,
    };
  }

  // 2) diskStorage
  if (file?.path) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: "image",
      ...(transformation ? { transformation } : {}),
    });

    try {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (e) {
      console.warn("⚠️ Could not delete local file:", file.path);
    }

    return {
      ...result,
      optimizedUrl:
        sizeBytes > MAX_BYTES
          ? makeOptimizedUrl(result.public_id)
          : result.secure_url,
    };
  }

  throw new Error("Invalid file: missing buffer/path");
};
