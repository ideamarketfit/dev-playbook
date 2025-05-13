# SEOPRO Platform Requirements for External Sites

This document outlines the required configuration and API endpoints that external websites must implement to be compatible with the SEOPRO keyword add workflow.

## 1. Site Configuration (config.yml)

Each site must include a `config.yml` at `sites/<site>/config.yml` with the following structure:

```yaml
# Base domain without protocol (required)
domain: example.com

# Multi–page–type configuration (required for sites with >1 page type)
page_types:
  - type: service_page         # (string, required) Unique identifier for this page type
    table: public.service_page # (string, required) DB table or external identifier
    about: |                   # (string, optional) Description shown in the SEOPRO UI
      > Example.com Service Pages
      - Competitors: A, B, C

# Legacy single–page–type format (supported)
# table: public.service_page
# about: ...
```

### Key Fields

- `domain` (required): Base domain for all SEOPRO API calls. Must be reachable over HTTPS.
- `page_types` (required for multi–type sites):
  - `type` (required): Used as the UI tab label and passed as `page_type`.
  - `table` (required): Passed to the API as `table` to scope keywords.
  - `about` (optional): Metadata displayed in the SEOPRO UI.

## 2. Required API Endpoints

External sites must expose the following endpoints under `/api/seo/keywords`:

### 2.1 GET /api/seo/keywords/all

Fetch all existing keywords for the given table (and optional page type):

- **Query Parameters**:
  - `table` (string, required)
  - `page_type` (string, optional)
- **Response (200 OK)**:
  ```json
  { "keywords": ["keyword1", "keyword2", ...] }
  ```
- **Error Response (400/500)**:
  ```json
  { "error": "Description of the error" }
  ```

### 2.2 POST /api/seo/keywords/add

Add new keywords to the backend system:

- **Query Parameters**:
  - `table` (string, required)
  - `page_type` (string, optional)
- **Request Body (JSON)**:
  ```json
  { "keywords": ["newkw1", "newkw2", ...] }
  ```
- **Response (200 OK)**:
  ```json
  {
    "added": 5,             // Number of keywords successfully added
    "errors": ["..."]     // (optional) Errors per batch if any
  }
  ```
- **Error Response**:
  ```json
  { "error": "Description of the error", "details": "..." }
  ```

#### Batching

The SEOPRO backend will split large keyword lists into batches of up to 50 per request. Your endpoint should accept arbitrary arrays and handle batch uploads efficiently.

## 3. Implementation Notes

- All endpoints must be accessible over HTTPS at `https://<domain>/api/seo/keywords/...`.
- No authentication is required; requests originate from the SEOPRO server.
- Ensure appropriate firewall or CORS settings to allow server-to-server POST/GET.
- Use proper HTTP status codes: 200 for success, 400 for client errors, 500 for server errors.

## 4. Testing and Verification

Use `curl` or Postman to validate your implementation:

```bash
# Fetch existing keywords
curl "https://example.com/api/seo/keywords/all?table=public.service_page"

# Add new keywords
curl -X POST "https://example.com/api/seo/keywords/add?table=public.service_page" \
     -H "Content-Type: application/json" \
     -d '{"keywords":["test1","test2"]}'
```

Ensure the JSON structure and status codes match the specifications above.

## 5. Batch Scheduling API Requirements

For integration with the SEOPRO Task Dashboard's batch scheduling feature, the following endpoints must be implemented under `/api/seo/batch`:

### 5.1 GET /api/seo/batch/tasks

Retrieve a paginated list of tasks for a given table (page type) and optional status.

- **Query Parameters**:
  - `start` (integer, required): Zero-based offset of the first task to return.
  - `size` (integer, required): Maximum number of tasks to return.
  - `table` (string, required): Table or page type identifier.
  - `status` (string, optional): Filter by task status (`empty`, `scheduled`, `running`, `success`, `failed`).
- **Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "task-id",
        "created_at": "2025-01-01T00:00:00Z",
        "last_edited_ts": "2025-01-02T00:00:00Z",
        "keyword": "example keyword",
        "slug": "example-keyword",
        "status": "empty"
      },
      ...
    ],
    "total": 123
  }
  ```
- **Error Response (400/500)**:
  ```json
  { "error": "Description of the error" }
  ```

### 5.2 POST /api/seo/batch/tasks/schedule

Schedule tasks for processing, either by status or by explicit task IDs.

- **Request Body (JSON)**: Must include `table` and either `status` or `taskIds`:
  ```json
  { 
    "table": "public.service_page",        // (string) Table or page type identifier
    "status": "empty",                     // (string, optional) Schedule all tasks with this status
    "taskIds": ["id1", "id2", ...]         // (string[], optional) Schedule specific task IDs
  }
  ```
- **Response (200 OK)**:
  ```json
  { "message": "Tasks scheduled successfully" }
  ```
- **Error Response (400/500)**:
  ```json
  { "error": "Description of the error" }
  ```

#### Testing Batch Scheduling

```bash
# List first 100 empty tasks
curl "https://example.com/api/seo/batch/tasks?start=0&size=100&table=public.service_page&status=empty"

# Schedule all empty tasks
curl -X POST "https://example.com/api/seo/batch/tasks/schedule" \
     -H "Content-Type: application/json" \
     -d '{"table":"public.service_page","status":"empty"}'

# Schedule specific tasks
curl -X POST "https://example.com/api/seo/batch/tasks/schedule" \
     -H "Content-Type: application/json" \
     -d '{"table":"public.service_page","taskIds":["task-id-1","task-id-2"]}'
```
