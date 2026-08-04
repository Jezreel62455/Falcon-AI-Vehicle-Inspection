/*
  Warnings:

  - You are about to drop the column `createdAtIndex` on the `Inspection` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Inspection` table without a default value. This is not possible if the table is not empty.

*/
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Inspection" ("colour", "createdAt", "customerFirstName", "customerSurname", "damagePhotos", "id", "inspectionType", "make", "mileage", "model", "photos", "policyNumber", "registration", "status", "year") SELECT "colour", "createdAt", "customerFirstName", "customerSurname", "damagePhotos", "id", "inspectionType", "make", "mileage", "model", "photos", "policyNumber", "registration", "status", "year" FROM "Inspection";
DROP TABLE "Inspection";
ALTER TABLE "new_Inspection" RENAME TO "Inspection";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
