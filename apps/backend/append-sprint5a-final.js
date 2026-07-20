const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. CustomerCredit Aging
const ccRegex = /(model CustomerCredit \{[\s\S]*?)(^\})/, ccMatch = schema.match(ccRegex);
if (ccMatch) {
  schema = schema.replace(ccRegex, `$1  age_0_30         Decimal  @default(0.0) @map("age_0_30") @db.Decimal(15, 2)
  age_31_60        Decimal  @default(0.0) @map("age_31_60") @db.Decimal(15, 2)
  age_61_90        Decimal  @default(0.0) @map("age_61_90") @db.Decimal(15, 2)
  age_90_plus      Decimal  @default(0.0) @map("age_90_plus") @db.Decimal(15, 2)\n$2`);
}

// 2. Customer Risk Score
const cRegex = /(model Customer \{[\s\S]*?)(^\})/, cMatch = schema.match(cRegex);
if (cMatch) {
  schema = schema.replace(cRegex, `$1  riskScore        String   @default("LOW") @map("risk_score") @db.VarChar(20)\n$2`);
}

// 3. SalesOrder Reservation Expiry
const soRegex = /(model SalesOrder \{[\s\S]*?)(^\})/, soMatch = schema.match(soRegex);
if (soMatch) {
  schema = schema.replace(soRegex, `$1  reservationExpiresAt DateTime? @map("reservation_expires_at")\n$2`);
}

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Sprint 5A Final Enhancements Injected into Schema.');
