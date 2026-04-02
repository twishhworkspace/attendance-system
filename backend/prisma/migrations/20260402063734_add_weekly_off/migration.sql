-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Department" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "weeklyOff" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Department" ("id", "name") SELECT "id", "name" FROM "Department";
DROP TABLE "Department";
ALTER TABLE "new_Department" RENAME TO "Department";
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
