-- CreateTable
CREATE TABLE "DepartmentExpense" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "month" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DepartmentExpense_propertyId_idx" ON "DepartmentExpense"("propertyId");

-- CreateIndex
CREATE INDEX "DepartmentExpense_department_idx" ON "DepartmentExpense"("department");

-- CreateIndex
CREATE INDEX "DepartmentExpense_month_idx" ON "DepartmentExpense"("month");

-- AddForeignKey
ALTER TABLE "DepartmentExpense" ADD CONSTRAINT "DepartmentExpense_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
