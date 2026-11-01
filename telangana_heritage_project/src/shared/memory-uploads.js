"use strict";

const MAX_IMAGE_BYTES = 2_000_000;

class UploadValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "UploadValidationError";
    this.code = code;
    this.statusCode = 400;
  }
}

function decodeImageDataUrl(value, maxBytes = MAX_IMAGE_BYTES) {
  if (typeof value !== "string" || value.length > Math.ceil(maxBytes * 4 / 3) + 100) {
    throw new UploadValidationError("INVALID_IMAGE", "Choose an optimised photo smaller than 2 MB.");
  }
  const match = /^data:(image\/webp|image\/jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) {
    throw new UploadValidationError("UNSUPPORTED_IMAGE", "Only optimised WebP and JPEG photos are supported.");
  }
  const contentType = match[1];
  const encoded = match[2];
  const buffer = Buffer.from(encoded, "base64");
  if (!buffer.length || buffer.length > maxBytes || buffer.toString("base64") !== encoded) {
    throw new UploadValidationError("INVALID_IMAGE_SIZE", "The photo must be between 1 byte and 2 MB.");
  }
  const isWebp = contentType === "image/webp" &&
    buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";
  const isJpeg = contentType === "image/jpeg" &&
    buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (!isWebp && !isJpeg) {
    throw new UploadValidationError("INVALID_IMAGE_CONTENT", "The uploaded file does not match a supported image format.");
  }
  return { buffer, contentType, extension: contentType === "image/webp" ? "webp" : "jpg" };
}

function optionalText(value, field, max) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") throw new UploadValidationError("INVALID_FIELD", field + " must be text.");
  const normalized = value.trim();
  if (normalized.length > max) throw new UploadValidationError("INVALID_FIELD", field + " must be " + max + " characters or fewer.");
  return normalized;
}

module.exports = { MAX_IMAGE_BYTES, UploadValidationError, decodeImageDataUrl, optionalText };
