# Security Architecture

Security is the highest priority for the Parental Control System given the sensitive nature of child tracking and media monitoring.

## 1. Authentication
- **Mechanism**: JSON Web Tokens (JWT).
- **Storage**: Passwords are never stored in plaintext. They are hashed using `bcrypt` (default 10 salt rounds) before insertion into the MongoDB database.
- **Tokens**: Upon successful login, a JWT containing the user's `_id` and `role` is generated. This token must be passed in the `Authorization: Bearer <token>` header for all protected routes.

## 2. Authorization & IDOR Prevention
Insecure Direct Object Reference (IDOR) is prevented using strict middleware and controller logic.
- **Family Isolation**: When fetching a Child, Device, or Location record, the backend explicitly verifies that the requested resource belongs to a Family/Parent ID that matches the `req.user.id` derived from the JWT.
- **Example**: `LocationRecord.find({ deviceId, childId: { $in: parent.childrenIds } })` ensures a parent can never view location data for a device they do not own.

## 3. WebSocket Security
- **Handshake Auth**: Socket.IO connections are rejected immediately if a valid JWT is not provided in the `auth: { token }` payload during the handshake.
- **Namespaces**: The system separates parent connections from child connections to ensure events are routed securely.

## 4. Rate Limiting
To prevent brute-force attacks and Denial of Service (DoS):
- `authLimiter`: Applied to `/api/auth/*`. Strictly limited (e.g., 10 requests per hour in production) to prevent password guessing.
- `mediaLimiter`: Applied to media uploads to prevent storage exhaustion.
- `apiLimiter`: Applied globally to all other routes.

## 5. Network Security
- **CORS**: Cross-Origin Resource Sharing is restricted. In production, only the defined `CLIENT_URL` is allowed to interact with the backend API.
- **Helmet**: HTTP headers are secured using the `helmet` package to prevent XSS, Clickjacking, and MIME-sniffing.
- **HTTPS**: Production deployments MUST run behind a reverse proxy (like Nginx) providing TLS/SSL encryption to prevent Man-in-the-Middle (MITM) attacks on the JWTs or location telemetry.

## 6. Audit & Logging
- Express routes are wrapped in centralized error handling.
- Development environments log stack traces for debugging, but Production environments return generic `500 Server Error` messages to prevent leaking internal infrastructure details.

## 7. What this System DOES NOT do
To comply with ethical and legal standards, the backend and Android client **do not** and **cannot**:
- Covertly record audio or phone calls.
- Capture passwords or keylogs.
- Extract third-party app databases (e.g., reading WhatsApp messages directly from SQLite).
- Perform Root exploits or bypass Android OS permissions.
