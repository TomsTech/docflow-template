# API: {{RESOURCE_NAME}}

> API endpoints for managing {{RESOURCE_DESCRIPTION}}.

---

## Base URL

```
{{BASE_URL}}/api/v1/{{resource}}
```

## Authentication

All endpoints require authentication unless marked as `Public`.

```http
Authorization: Bearer {{jwt_token}}
```

---

## Endpoints

### List {{RESOURCE_NAME}}

Retrieve a paginated list of {{resource}}.

```http
GET /api/v1/{{resource}}
```

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `per_page` | integer | No | 20 | Items per page (max 100) |
| `sort` | string | No | `-created_at` | Sort field (prefix `-` for descending) |
| `filter[status]` | string | No | - | Filter by status |
| `search` | string | No | - | Search query |

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "Example 1",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid-2",
      "name": "Example 2",
      "status": "active",
      "created_at": "2024-01-14T09:00:00Z"
    }
  ],
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z",
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

---

### Get {{RESOURCE_NAME}}

Retrieve a single {{resource}} by ID.

```http
GET /api/v1/{{resource}}/:id
```

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Resource identifier |

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "uuid-1",
    "name": "Example",
    "description": "Detailed description",
    "status": "active",
    "metadata": {
      "key": "value"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

---

### Create {{RESOURCE_NAME}}

Create a new {{resource}}.

```http
POST /api/v1/{{resource}}
```

**Request Body**:

```json
{
  "name": "string (required, 1-255 chars)",
  "description": "string (optional, max 2000 chars)",
  "status": "string (optional, enum: active|inactive)",
  "metadata": {
    "key": "value (optional)"
  }
}
```

**Validation Rules**:

| Field | Rules |
|-------|-------|
| `name` | Required, 1-255 characters, unique per tenant |
| `description` | Optional, max 2000 characters |
| `status` | Optional, must be `active` or `inactive` |

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "uuid-new",
    "name": "New Resource",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

---

### Update {{RESOURCE_NAME}}

Update an existing {{resource}}.

```http
PUT /api/v1/{{resource}}/:id
```

**Request Body**:

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "status": "inactive"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "uuid-1",
    "name": "Updated Name",
    "status": "inactive",
    "updated_at": "2024-01-15T11:00:00Z"
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

---

### Delete {{RESOURCE_NAME}}

Delete a {{resource}}.

```http
DELETE /api/v1/{{resource}}/:id
```

**Response** (204 No Content):

No response body.

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": ["validation error"]
    }
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 400 | `INVALID_INPUT` | Malformed request body |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource already exists |
| 422 | `UNPROCESSABLE` | Business logic error |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Rate Limits

| Tier | Requests | Window | Burst |
|------|----------|--------|-------|
| Free | 100 | 1 hour | 10 |
| Pro | 1,000 | 1 hour | 50 |
| Enterprise | 10,000 | 1 hour | 200 |

**Rate Limit Headers**:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642252800
```

---

## Examples

### cURL

```bash
# List resources
curl -X GET "https://api.example.com/api/v1/{{resource}}?page=1&per_page=10" \
  -H "Authorization: Bearer $TOKEN"

# Create resource
curl -X POST "https://api.example.com/api/v1/{{resource}}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Resource"}'

# Update resource
curl -X PUT "https://api.example.com/api/v1/{{resource}}/uuid-1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Delete resource
curl -X DELETE "https://api.example.com/api/v1/{{resource}}/uuid-1" \
  -H "Authorization: Bearer $TOKEN"
```

### JavaScript/TypeScript

```typescript
import { ApiClient } from '@company/api-client';

const client = new ApiClient({ token: process.env.API_TOKEN });

// List
const resources = await client.{{resource}}.list({ page: 1, perPage: 10 });

// Get
const resource = await client.{{resource}}.get('uuid-1');

// Create
const newResource = await client.{{resource}}.create({ name: 'New' });

// Update
const updated = await client.{{resource}}.update('uuid-1', { name: 'Updated' });

// Delete
await client.{{resource}}.delete('uuid-1');
```

---

## Webhooks

### Events

| Event | Description |
|-------|-------------|
| `{{resource}}.created` | Fired when a resource is created |
| `{{resource}}.updated` | Fired when a resource is updated |
| `{{resource}}.deleted` | Fired when a resource is deleted |

### Payload

```json
{
  "event": "{{resource}}.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "uuid-1",
    "name": "New Resource"
  }
}
```

---

## Related Documentation

- [Authentication Guide](./authentication.md)
- [Error Handling](./errors.md)
- [Pagination](./pagination.md)
