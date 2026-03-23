-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'PACKAGING', 'SHIPPED', 'RECEIVED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "packagedAt" TIMESTAMP(3),
ADD COLUMN "shippedAt" TIMESTAMP(3),
ADD COLUMN "receivedAt" TIMESTAMP(3);
