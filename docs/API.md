# MallikaAI API Documentation

Base URL: `http://localhost:8000`

## Authentication

### Register
```
POST /api/auth/register
Body: { "email": "...", "password": "...", "name": "..." }
Response: { "access_token": "...", "token_type": "bearer", "user": {...} }
```

### Login
```
POST /api/auth/login
Body: { "email": "...", "password": "..." }
Response: { "access_token": "...", "token_type": "bearer", "user": {...} }
```

### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

## Chat

### Send Message (SSE Streaming)
```
POST /api/chat/send
Content-Type: multipart/form-data
Fields: message, conversation_id, model, provider, files[]
Response: Server-Sent Events stream
```

### Quick Chat (No Auth)
```
POST /api/chat/quick
Content-Type: multipart/form-data
Fields: message, model, provider
Response: Server-Sent Events stream
```

### WebSocket Chat
```
WS /ws/chat/{conversation_id}
Send: { "type": "message", "content": "...", "model": "...", "provider": "...", "user_id": "..." }
Receive: { "type": "stream|tool_start|tool_result|done|error", ... }
```

## Conversations

### List Conversations
```
GET /api/conversations
Response: [{ "id": "...", "title": "...", "model": "...", "updated_at": "..." }]
```

### Create Conversation
```
POST /api/conversations
Body: { "title": "...", "model": "...", "provider": "..." }
```

### Get Conversation with Messages
```
GET /api/conversations/{id}
```

### Delete Conversation
```
DELETE /api/conversations/{id}
```

## Files

### Upload File
```
POST /api/files/upload
Content-Type: multipart/form-data
Fields: file, conversation_id?, space_id?
```

### List Files
```
GET /api/files
```

### Download File
```
GET /api/files/{id}/download
```

### Delete File
```
DELETE /api/files/{id}
```

## Spaces (Knowledge Base)

### List Spaces
```
GET /api/spaces
```

### Create Space
```
POST /api/spaces
Body: { "name": "...", "description": "..." }
```

### Upload to Space
```
POST /api/spaces/{id}/upload
Content-Type: multipart/form-data
Fields: file
```

### Query Space
```
POST /api/spaces/{id}/query
Body: { "question": "...", "top_k": 5 }
```

## Models

### List Available Models
```
GET /api/models
```

### List Providers
```
GET /api/models/providers
```

## Search

### Web Search
```
POST /api/search/web
Body: { "query": "...", "num_results": 5 }
```

## Stream Event Types

| Type | Description |
|------|-------------|
| `stream` | Text content chunk |
| `tool_start` | Tool execution started |
| `tool_result` | Tool execution completed |
| `tool_error` | Tool execution failed |
| `done` | Response complete |
| `error` | Error occurred |
