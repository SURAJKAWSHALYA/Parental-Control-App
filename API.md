# API Documentation

The Parental Control API uses standard REST principles and returns JSON responses.

## Base URL
`/api`

## Response Format
All successful and error responses follow a standard wrapper:
```json
{
  "success": true,
  "message": "Human readable message",
  "data": { ... }
}
```

Errors:
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "SPECIFIC_ERROR_CODE"
}
```

## Authentication (`/api/auth`)

### `POST /register`
Registers a new parent account.
- **Body**: `{ fullName, email, password }`
- **Response**: JWT Token & User Data

### `POST /login`
Authenticates an existing parent.
- **Body**: `{ email, password }`
- **Response**: JWT Token & User Data

### `GET /me`
Returns the currently authenticated parent's profile.
- **Headers**: `Authorization: Bearer <token>`

---

## Children (`/api/children`)
*All routes require JWT Authorization*

### `GET /`
Returns a list of children belonging to the authenticated parent.

### `POST /`
Registers a new child profile.
- **Body**: `{ name, dateOfBirth }`

### `GET /:id`
Fetch a specific child's details. Returns 404 if the child does not belong to the parent.

---

## Devices (`/api/devices`)
*All routes require JWT Authorization*

### `GET /child/:childId`
Fetch all devices linked to a specific child.

### `POST /pair`
Pair a physical Android device to a child profile.
- **Body**: `{ childId, deviceName, os, androidVersion, deviceModel, manufacturer, deviceIdentifier }`

---

## Location (`/api/location`)
*All routes require JWT Authorization*

### `POST /sync`
Called by the Android client to bulk-upload cached location records.
- **Body**: `{ deviceId, locations: [{ latitude, longitude, accuracy, timestamp }] }`
- **Note**: Implements deduplication based on `timestamp`.

### `GET /history/:deviceId`
Fetch paginated location history.
- **Query**: `?page=1&limit=100`

### `POST /geofence`
Create a safe/danger zone for a device.
- **Body**: `{ deviceId, name, latitude, longitude, radiusMeters, type: "safe" | "danger" }`

---

## Chat & Media (`/api/chat`)
*All routes require JWT Authorization*

### `GET /:familyId`
Fetch chat history for the family room.

### `POST /media` (Multipart Form)
Upload a photo/video. 
- **Form Data**: `file` (the image/video), `familyId`, `senderId`, `senderModel`.
- **Note**: Trigger's AI Safety scanning in the background.

## Safety & Intelligence (`/api/intelligence`)
### `GET /report/:childId`
Generates an AI Safety Report summarizing risk levels across chat, web, and app usage.
