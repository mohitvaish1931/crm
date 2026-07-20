const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

function injectRelation(modelName, fieldDefinition) {
  const modelRegex = new RegExp(`(model ${modelName} \\{[\\s\\S]*?)(^\\})`, 'm');
  schema = schema.replace(modelRegex, `$1  ${fieldDefinition}\n$2`);
}

injectRelation('Transporter', 'tenant Tenant @relation(fields: [tenantId], references: [id])');
injectRelation('ReturnReasonCatalog', 'tenant Tenant @relation(fields: [tenantId], references: [id])');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Sprint 5B inverse relations injected.');
