# Private travel memories

The Travel Memories feature is an account-owned photo journal. It is not a public photo feed.

## Storage and access

- Images are stored in a Vercel Blob store with private access in the Mumbai region (bom1).
- The travel_memories table stores photo metadata, the private Blob pathname, the owning Clerk user ID, and timestamps.
- Every list, image-read, and delete operation verifies the Clerk bearer token and filters metadata by the authenticated user ID.
- Image bytes are streamed through the memories API after ownership is checked. Raw private Blob paths are never exposed to the browser.
- Deleting a memory deletes the private Blob and its metadata row.
- The public destination gallery remains separate from personal photos.

## Upload protections

- Accepts JPEG and WebP image data only after MIME and magic-byte checks.
- The browser decodes the original image and re-encodes it as WebP/JPEG on a canvas. This removes embedded EXIF fields, including camera GPS metadata.
- Longest image edge is reduced to 1,800 pixels; optimised uploads are capped at 2 MB each.
- Server upload requests are capped at 3 MB and each user is rate-limited to 12 uploads per hour.
- Up to 10 images may be submitted in one browser batch.
- SVG, arbitrary files, and unsupported content types are rejected.

## Operational requirements

- BLOB_READ_WRITE_TOKEN must be configured in Vercel for Preview and Production.
- The production database migration 0001_travel_memories is ap¶»§q«^