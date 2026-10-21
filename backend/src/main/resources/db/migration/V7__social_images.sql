-- Store the optional local upload path used as an interest team's cover image.
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "image" TEXT;
