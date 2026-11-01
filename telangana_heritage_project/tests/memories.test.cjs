"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { MAX_IMAGE_BYTES, UploadValidationError, decodeImageDataUrl, optionalText } = require("../src/shared/memory-uploads");

test("accepts WebP only when the RIFF/WEBP signature matches", () => {
  const bytes = Buffer.from("RIFF0000WEBP", "ascii");
  const result = decodeImageDataUrl("data:image/webp;base64," + bytes.toString("base64"));
  assert.equal(result.contentType, "image/webp");
  assert.equal(result.extension, "webp");
  assert.deepEqual(result.buffer, bytes);
});
test("accepts JPEG only with the JPEG signature", () => {
  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  const result = decodeImageDataUrl("data:image/jpeg;base64," + bytes.toString("base64"));
  assert.equal(result.contentType, "image/jpeg");
});
test("rejects SVG and non-approved content types", () => {
  assert.throws(() => decodeImageDataUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="),
    error => error instanceof UploadValidationError && error.code === "UNSUPPORTED_IMAGE");
});
test("rejects spoofed MIME types", () => {
  const bytes = Buffer.from("<svg></svg>", "ascii");
  assert.throws(() => decodeImageDataUrl("data:image/webp;base64," + bytes.toString("base64")),
    error => error.code === "INVALID_IMAGE_CONTENT");
});
test("rejects oversized and malformed data URLs", () => {
  assert.throws(() => decodeImageDataUrl("data:image/jpeg;base64,@@@@"));
  const large = Buffer.alloc(MAX_IMAGE_BYTES + 1, 1);
  assert.throws(() => decodeImageDataUrl("data:image/jpeg;base64," + large.toString("base64")));
});
test("normalises optional metadata without allowing non-text values", () => {
  assert.equal(optionalText("  Ramappa Temple  ", "Destination", 100), "Ramappa Temple");
  assert.equal(optionalText("", "Caption", 220), "");
  assert.throws(() => optionalText({ value: "bad" }, "Caption", 220));
});
