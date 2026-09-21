CREATE TABLE "app_branding" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "logoData" BYTEA,
    "logoMime" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_branding_pkey" PRIMARY KEY ("id")
);

INSERT INTO "app_branding" ("id", "title", "subtitle", "updatedAt")
VALUES ('default', 'CGV - HRAS', 'City Government of Vigan', CURRENT_TIMESTAMP);

INSERT INTO "permissions" ("id", "module", "action")
VALUES (gen_random_uuid()::text, 'branding', 'edit');

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id" FROM "roles" r, "permissions" p
WHERE r."name" = 'Administrator' AND p."module" = 'branding' AND p."action" = 'edit';
