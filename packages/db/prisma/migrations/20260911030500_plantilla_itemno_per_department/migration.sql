-- itemNo is not globally unique in the real legacy data — 21 of 855 real
-- item numbers are reused across different departments (legacy's own
-- indexes key it as Type+Dept-Code+Div-Code+Item-No). Switching the
-- constraint to (departmentId, itemNo); the 834 rows currently in this
-- table (already deduped by the old global-unique constraint, silently
-- dropping those 21 real items) get re-imported afterward by
-- packages/db/scripts/import-plantilla.mjs to recover them.
DROP INDEX "plantillas_itemNo_key";

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_departmentId_itemNo_key" ON "plantillas"("departmentId", "itemNo");
