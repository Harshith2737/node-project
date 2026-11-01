# Private travel memories

Travel Memories is an account-owned photo journal, not a public photo feed.

## Storage and access
- Photos are stored in the project's private Vercel Blob store in the Mumbai region.
- The `travel_memories` table stores metadata, the private Blob pathname, the owning Clerk user ID and timestamps.
- Every list, image-read and delete operation verifies the active Clerk session and filters records by the authenticated user ID.
- Private image bytes are streamed through the authenticated API after ownership is checked. Raw Blob paths are never sent to the browser.
- Deleting a memory deletes its private Blob and corresponding metadata row.
- The public destination gallery remains separate from personal photos.

## Upload protections
- The browser accepts JPEG, PNG and WebP source photos and re-encodes them as WebP or JPEG using a canvas.
- Re-encoding removes embedded EXIF data, including camera GPS metadata.
- The longest edge is reduced to 1,800 pixels; stored images are capped at 2 MB.
- The server checks the declared MIME type against the JPEG or WebP file signature.
- Upload requests are capped at 3 MB, and each account is limited to 12 uploads per hour.
- Up to 10 photos can be uploaded in one batch.
- SVG and arbitrary file uploads are rejected.

## Required Vercel configuration
- `BLOB_READ_WRITE_TOKEN` must be available to Preview and Production. The existing project Blob integration supplies this variable.
- The Blob store must have **Private** access enabled. The connected project store is private and located in `bom1`.
- Production deployment runs the additive Drizzle migration `0001_travel_memories`; preview builds do not run database migrations.
