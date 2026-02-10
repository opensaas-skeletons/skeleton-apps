# Interop Standard

## Version 1.0

Skeleton CRM supports import/export in the Open SaaS Skeletons interop format.

### Export

`GET /api/export` returns the full CRM data in portable JSON format.

### Import

`POST /api/import` accepts interop JSON and creates all entities using name-based references.

### Import Order

1. Companies (no dependencies)
2. Contacts (references companies by name)
3. Pipelines + Stages (no dependencies)
4. Deals (references pipelines/stages by title, contacts by email, companies by name)
5. Activities (references contacts by email, deals by title, companies by name)

### Format

See `shared/types/crm.ts` for `CrmExportPayload` type definition.
