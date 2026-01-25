-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "workType" TEXT,
    "description" TEXT,
    "targetDate" DATETIME,
    "displayQty" INTEGER,
    "productionQty" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerContact" TEXT,
    "pickupType" TEXT NOT NULL,
    "address" TEXT,
    "deliveryFee" INTEGER,
    "pickupDate" DATETIME,
    "pickupTime" TEXT,
    "request" TEXT,
    "items" TEXT NOT NULL,
    "totalPrice" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "memo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LunchClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "contactNumber" TEXT,
    "address" TEXT,
    "defaultStaffCount" INTEGER NOT NULL DEFAULT 0,
    "deadlineTime" TEXT NOT NULL DEFAULT '10:00',
    "lunchboxPrice" INTEGER NOT NULL DEFAULT 0,
    "saladPrice" INTEGER NOT NULL DEFAULT 0,
    "paymentType" TEXT NOT NULL DEFAULT 'DAILY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "memo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LunchDailyMenu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "lunchboxLayout" TEXT NOT NULL,
    "saladLayout" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LunchOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "clientId" TEXT NOT NULL,
    "lunchboxCount" INTEGER NOT NULL DEFAULT 0,
    "saladCount" INTEGER NOT NULL DEFAULT 0,
    "memo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "modifiedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LunchOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "LunchClient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LunchDailyMenu_date_key" ON "LunchDailyMenu"("date");

-- CreateIndex
CREATE UNIQUE INDEX "LunchOrder_date_clientId_key" ON "LunchOrder"("date", "clientId");
