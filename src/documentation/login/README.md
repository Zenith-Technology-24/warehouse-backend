### `POST /api/auth/login`

Authenticates a user and returns a JWT token.

## Request

### Headers

- **Content-Type**: `application/json`

### Body Parameters

The login request must include the following JSON fields:

- **email** (string, required): The email address of the user.
- **password** (string, required): The password of the user.

### Example Request

```bash
POST /api/auth/login HTTP/1.1
Host: your-api-url.com
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123"
}
