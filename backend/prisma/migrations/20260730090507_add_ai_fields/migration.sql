-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "inspectionType" TEXT,
    "customerFirstName" TEXT,
    "customerSurname" TEXT,
    "policyNumber" TEXT,
    "insuranceCompany" TEXT,
    "registration" TEXT,
    "make" TEXT,
    "model" TEXT,
    "year" TEXT,
    "colour" TEXT,
    "mileage" TEXT,
    "photos" JSONB,
    "damagePhotos" JSONB,
    "aiStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "aiScore" REAL,
    "damageDetected" BOOLEAN NOT NULL DEFAULT false,
    "damageSummary" TEXT,
    "vinExtracted" TEXT,
    "odometerReading" TEXT,
    "aiProvider" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Inspection" ("colour", "createdAt", "customerFirstName", "customerSurname", "damagePhotos", "id", "inspectionType", "insuranceCompany", "make", "mileage", "model", "photos", "policyNumber", "registration", "status", "updatedAt", "year") SELECT "colour", "createdAt", "customerFirstName", "customerSurname", "damagePhotos", "id", "inspectionType", "insuranceCompany", "make", "mileage", "model", "photos", "policyNumber", "registration", "status", "updatedAt", "year" FROM "Inspection";
DROP TABLE "Inspection";
ALTER TABLE "new_Inspection" RENAME TO "Inspection";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
