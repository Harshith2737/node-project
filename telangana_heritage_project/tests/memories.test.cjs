"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MAX_IMAGE_BYTES,
  UploadValidationError,
  decodeImageDataUrl,
  optionalText
} = require("../src/shared/memory-uploads");

test("accepts a WebP data URL only when the RIFF/WEBP signature matches", () => {
  const bytes = Buffer.from("RIFF0000WEBP", "ascii");
  const result = decodeImageDataUrl("data:image/webp;base64," + bytes.toString("base64"));
  assert.equal(result.contentType, "image/webp");
  assert.equal(result.extension, "webp");
  assert.deepEqual(result.buffer, bytes);
});

test("accepts a JPEG data URL with a JPEG signature", () => {
  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  const result = decodeImageDataUrl("data:image/jpeg;base64," + bytes.toString("base64"));
  assert.equal(result.contentType, "image/jpeg");
  assert.equal(result.extension, "jpg");
});

test("rejects SVG and other image-like data URLs", () => {
  assert.throws(
    () => decodeImageDataUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="),
    error => error instanceof UploadValidationError && error.code === "UNSUPPORTED_IMAGE"
  );
});

test("rejects a spoofed MIME type or a mismatched file signature", () => {
  const bytes = Buffer.from("<svg></svg>", "ascii");
  assert.throws(
    () => decodeImageDataUrl("data:image/webp;base64," + bytes.toString("base64")),
    error => error.code === "INVALID_IMAGE_CONTENT"
  );
});

test("rejects malformed base64 and oversized images", ()¶»§q«^