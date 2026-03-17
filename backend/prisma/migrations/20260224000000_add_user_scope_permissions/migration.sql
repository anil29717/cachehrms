-- CreateTable
CREATE TABLE "user_scope_permissions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scope_id" TEXT NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_scope_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_scope_permissions_user_id_idx" ON "user_scope_permissions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_scope_permissions_user_id_scope_id_key" ON "user_scope_permissions"("user_id", "scope_id");

-- AddForeignKey
ALTER TABLE "user_scope_permissions" ADD CONSTRAINT "user_scope_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
