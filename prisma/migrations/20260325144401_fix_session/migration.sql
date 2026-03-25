/*
  Warnings:

  - The primary key for the `session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `session` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "session_sid_key";

-- AlterTable
ALTER TABLE "session" DROP CONSTRAINT "session_pkey",
DROP COLUMN "id",
ALTER COLUMN "sid" SET DATA TYPE VARCHAR,
ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");
