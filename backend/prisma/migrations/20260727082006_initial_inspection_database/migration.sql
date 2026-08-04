-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "inspectionType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerFirstName" TEXT,
    "customerSurname" TEXT,
    "policyNumber" TEXT,
    "registration" TEXT,
    "make" TEXT,
    "model" TEXT,
    "year" TEXT,
    "colour" TEXT,
    "mileage" TEXT,
    "photos" JSONB,
    "damagePhotos" JSONB,
    "createdAtIndex" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Inspection_createdAt_idx" ON "Inspection"("createdAt");

-- CreateIndex
CREATE INDEX "Inspection_status_idx" ON "Inspection"("status");

-- CreateIndex
CREATE INDEX "Inspection_inspectionType_idx" ON "Inspection"("inspectionType");
