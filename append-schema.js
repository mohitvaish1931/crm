const fs = require('fs');
const path = require('path');
const schemaPath = path.join('apps', 'backend', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

const newModels = `
// --- IAM MODULE ---

model Role {
  id          String    @id @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  name        String    @db.VarChar(100)
  description String?   @db.VarChar(255)
  isSystem    Boolean   @default(false) @map("is_system")
  
  createdBy   String?   @map("created_by") @db.Uuid
  updatedBy   String?   @map("updated_by") @db.Uuid
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  tenant      Tenant    @relation(fields: [tenantId], references: [id])
  permissions RolePermission[]
  users       UserRole[]

  @@unique([tenantId, name])
  @@map("roles")
}

model Permission {
  id          String    @id @db.Uuid
  resource    String    @db.VarChar(100)
  action      String    @db.VarChar(100)
  description String?   @db.VarChar(255)
  version     Int       @default(1)
  
  roles       RolePermission[]

  @@unique([resource, action, version])
  @@map("permissions")
}

model RolePermission {
  id           String    @id @db.Uuid
  roleId       String    @map("role_id") @db.Uuid
  permissionId String    @map("permission_id") @db.Uuid

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

model UserRole {
  id       String @id @db.Uuid
  userId   String @map("user_id") @db.Uuid
  roleId   String @map("role_id") @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid // Denormalized for security

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@map("user_roles")
}

// --- ORGANIZATION MODULE ---

model Branch {
  id        String    @id @db.Uuid
  tenantId  String    @map("tenant_id") @db.Uuid
  name      String    @db.VarChar(255)
  isDefault Boolean   @default(false) @map("is_default")
  
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  tenant     Tenant      @relation(fields: [tenantId], references: [id])
  warehouses Warehouse[]

  @@map("branches")
}

model Warehouse {
  id        String    @id @db.Uuid
  tenantId  String    @map("tenant_id") @db.Uuid
  branchId  String    @map("branch_id") @db.Uuid
  name      String    @db.VarChar(255)
  isDefault Boolean   @default(false) @map("is_default")
  
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])
  branch Branch @relation(fields: [branchId], references: [id])

  @@map("warehouses")
}

// --- SETTINGS MODULE ---

model TenantSetting {
  id                 String  @id @db.Uuid
  tenantId           String  @unique @map("tenant_id") @db.Uuid
  companyName        String? @map("company_name") @db.VarChar(255)
  gstNumber          String? @map("gst_number") @db.VarChar(50)
  currency           String  @default("INR") @db.VarChar(3)
  timezone           String  @default("Asia/Kolkata") @db.VarChar(50)
  dateFormat         String  @default("DD-MM-YYYY") @map("date_format") @db.VarChar(20)
  invoicePrefix      String? @map("invoice_prefix") @db.VarChar(10)
  nextInvoiceNumber  Int     @default(1) @map("next_invoice_number")
  themeOverride      Json?   @map("theme_override")
  
  version            Int     @default(1)
  updatedAt          DateTime @updatedAt @map("updated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("tenant_settings")
}

model TenantSettingsHistory {
  id        String   @id @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  version   Int
  before    Json
  after     Json
  updatedBy String?  @map("updated_by") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("tenant_settings_history")
}

model UserPreference {
  id        String  @id @db.Uuid
  userId    String  @unique @map("user_id") @db.Uuid
  theme     String  @default("system") @db.VarChar(20)
  language  String  @default("en") @db.VarChar(10)
  sidebar   String  @default("expanded") @db.VarChar(20)
  density   String  @default("comfortable") @db.VarChar(20)
  
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}

model Invitation {
  id        String   @id @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  email     String   @db.VarChar(255)
  roleId    String   @map("role_id") @db.Uuid
  tokenHash String   @unique @map("token_hash")
  status    String   @default("PENDING") @db.VarChar(20)
  expiresAt DateTime @map("expires_at")
  
  createdBy String?  @map("created_by") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")
  revokedAt DateTime? @map("revoked_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])
  role   Role   @relation(fields: [roleId], references: [id])

  @@map("invitations")
}
`;

content += newModels;
fs.writeFileSync(schemaPath, content);
console.log('Appended models');
