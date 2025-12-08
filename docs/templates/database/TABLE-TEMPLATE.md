# Table: {{TABLE_NAME}}

> {{TABLE_DESCRIPTION}}

---

## Overview

### Purpose

{{DETAILED_PURPOSE}}

### Ownership

| Attribute | Value |
|-----------|-------|
| Schema | `{{SCHEMA}}` |
| Owner | {{TEAM/MODULE}} |
| Created | {{DATE}} |
| Last Modified | {{DATE}} |

---

## Schema Definition

```sql
CREATE TABLE {{schema}}.{{table_name}} (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core Fields
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active',

    -- Foreign Keys
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT {{table_name}}_name_unique UNIQUE (tenant_id, name),
    CONSTRAINT {{table_name}}_status_check CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Indexes
CREATE INDEX idx_{{table_name}}_tenant_id ON {{schema}}.{{table_name}}(tenant_id);
CREATE INDEX idx_{{table_name}}_status ON {{schema}}.{{table_name}}(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_{{table_name}}_created_at ON {{schema}}.{{table_name}}(created_at DESC);
CREATE INDEX idx_{{table_name}}_search ON {{schema}}.{{table_name}} USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Triggers
CREATE TRIGGER {{table_name}}_updated_at
    BEFORE UPDATE ON {{schema}}.{{table_name}}
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Column Reference

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Primary key |
| `name` | VARCHAR(255) | No | - | Display name |
| `description` | TEXT | Yes | - | Detailed description |
| `status` | VARCHAR(50) | No | 'active' | Record status |
| `tenant_id` | UUID | No | - | Tenant reference (FK) |
| `created_by` | UUID | Yes | - | Creating user (FK) |
| `metadata` | JSONB | Yes | '{}' | Additional data |
| `created_at` | TIMESTAMPTZ | No | now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | now() | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | Yes | - | Soft delete timestamp |

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ENTITY RELATIONSHIPS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐    │
│  │   tenants    │─────1:N─│ {{TABLE}}    │─N:1─────│    users     │    │
│  │              │         │              │         │              │    │
│  │ id (PK)      │         │ id (PK)      │         │ id (PK)      │    │
│  │ name         │         │ tenant_id    │◀────────│ name         │    │
│  └──────────────┘         │ created_by   │─────────▶│ email        │    │
│                           └──────────────┘         └──────────────┘    │
│                                  │                                      │
│                                  │ 1:N                                  │
│                                  ▼                                      │
│                          ┌──────────────┐                              │
│                          │ child_table  │                              │
│                          │              │                              │
│                          │ id (PK)      │                              │
│                          │ parent_id    │                              │
│                          └──────────────┘                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Foreign Keys

| Column | References | On Delete | On Update |
|--------|------------|-----------|-----------|
| `tenant_id` | `public.tenants(id)` | CASCADE | NO ACTION |
| `created_by` | `public.users(id)` | SET NULL | NO ACTION |

### Referenced By

| Table | Column | Relationship |
|-------|--------|--------------|
| `child_table` | `parent_id` | Many-to-One |
| `junction_table` | `{{table}}_id` | Many-to-Many |

---

## Indexes

| Name | Columns | Type | Purpose |
|------|---------|------|---------|
| `{{table_name}}_pkey` | `id` | B-tree | Primary key lookup |
| `idx_{{table_name}}_tenant_id` | `tenant_id` | B-tree | Tenant filtering |
| `idx_{{table_name}}_status` | `status` | Partial B-tree | Active records only |
| `idx_{{table_name}}_created_at` | `created_at` | B-tree DESC | Recent records |
| `idx_{{table_name}}_search` | `name, description` | GIN (tsvector) | Full-text search |

---

## Constraints

### Check Constraints

| Name | Expression | Purpose |
|------|------------|---------|
| `{{table_name}}_status_check` | `status IN ('active', 'inactive', 'archived')` | Valid status values |

### Unique Constraints

| Name | Columns | Purpose |
|------|---------|---------|
| `{{table_name}}_name_unique` | `(tenant_id, name)` | Unique name per tenant |

---

## Metadata Schema

The `metadata` JSONB column supports the following structure:

```json
{
  "tags": ["string"],
  "priority": "low|medium|high",
  "custom_fields": {
    "field_name": "value"
  },
  "integrations": {
    "external_id": "string",
    "sync_status": "synced|pending|error"
  }
}
```

### Querying Metadata

```sql
-- Find by tag
SELECT * FROM {{table_name}}
WHERE metadata->'tags' ? 'important';

-- Find by custom field
SELECT * FROM {{table_name}}
WHERE metadata->'custom_fields'->>'field_name' = 'value';

-- Update metadata field
UPDATE {{table_name}}
SET metadata = jsonb_set(metadata, '{priority}', '"high"')
WHERE id = 'uuid';
```

---

## Common Queries

### List Active Records

```sql
SELECT id, name, status, created_at
FROM {{schema}}.{{table_name}}
WHERE tenant_id = $1
  AND status = 'active'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### Search Records

```sql
SELECT id, name, ts_rank(
  to_tsvector('english', name || ' ' || COALESCE(description, '')),
  plainto_tsquery('english', $2)
) AS rank
FROM {{schema}}.{{table_name}}
WHERE tenant_id = $1
  AND to_tsvector('english', name || ' ' || COALESCE(description, ''))
      @@ plainto_tsquery('english', $2)
ORDER BY rank DESC
LIMIT 10;
```

### Soft Delete

```sql
UPDATE {{schema}}.{{table_name}}
SET deleted_at = now(),
    status = 'archived'
WHERE id = $1 AND tenant_id = $2;
```

---

## Migrations

### Initial Creation

```sql
-- Migration: 20240115_create_{{table_name}}
-- Up
CREATE TABLE ...

-- Down
DROP TABLE IF EXISTS {{schema}}.{{table_name}};
```

### Adding Columns

```sql
-- Migration: 20240201_add_{{column}}_to_{{table_name}}
-- Up
ALTER TABLE {{schema}}.{{table_name}}
ADD COLUMN {{column}} {{TYPE}} {{CONSTRAINTS}};

-- Down
ALTER TABLE {{schema}}.{{table_name}}
DROP COLUMN IF EXISTS {{column}};
```

---

## Data Lifecycle

### Creation

1. Validate input data
2. Set `tenant_id` from auth context
3. Set `created_by` from auth context
4. Insert record
5. Publish `{{table_name}}.created` event

### Updates

1. Validate ownership (tenant check)
2. Validate permissions
3. Update fields
4. `updated_at` auto-updates via trigger
5. Publish `{{table_name}}.updated` event

### Deletion

1. Validate ownership
2. Check for dependent records
3. Soft delete (set `deleted_at`)
4. Publish `{{table_name}}.deleted` event

### Retention

| Data Type | Retention Period | Archive Strategy |
|-----------|------------------|------------------|
| Active records | Indefinite | N/A |
| Soft-deleted | 90 days | Move to archive table |
| Archived | 7 years | Cold storage |

---

## Related Tables

- [tenants](./tenants.md) - Multi-tenancy
- [users](./users.md) - User management
- [audit_logs](./audit_logs.md) - Change tracking

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| {{DATE}} | {{AUTHOR}} | Initial schema |
