### `POST /api/inventory?page=1&limit=5`

Return all inventory with pagination

## Request

### Headers

- **Content-Type**: `application/json`

### Body Parameters

N/A

### Example Request

```bash
POST /api/?page=2&limit=5 HTTP/1.1
Host: your-api-url.com
Content-Type: application/json

{
    "inventory": [
        {
            "id": 1,
            "product_name": "Shabu",
            "category": "Drugs",
            "size": "10g",
            "in_stock": 100,
            "cost": "1000.00",
            "price": "1000.00",
            "created_at": "2024-08-16T01:26:56.000Z",
            "updated_at": "2024-08-16T01:26:56.000Z"
        }
    ],
    "total": 1,
    "currentPage": 1,
    "totalPages": 1
}
```


### `POST /api/inventory/create`

Create a new inventory

## Request

### Headers

- **Content-Type**: `application/json`

### Body Parameters

The create request must include the following JSON fields:

- **product_name** (string, required)
- **category** (string, required)
- **size** (string, required)
- **in_stock** (int, required)
- **cost** (string, required)
- **price** (string, required)

### Example Request

```bash
POST /api/inventory/create HTTP/1.1
Host: your-api-url.com
Content-Type: application/json

{
    "product_name": "Shabu",
    "category": "Drugs",
    "size": "10g",
    "in_stock": 100,
    "cost": "1000.00",
    "price": "1000.00",
    "created_at": "2024-08-16T01:26:56.000Z",
    "updated_at": "2024-08-16T01:26:56.000Z"
}
```

### `POST /api/inventory/{id}/update`

Update inventory

## Request

### Headers

- **Content-Type**: `application/json`

### Body Parameters

The update request must include the following JSON fields:

- **product_name** (string)
- **category** (string)
- **size** (string)
- **in_stock** (string)
- **cost** (string)
- **price** (string)

### Example Request

```bash
POST /api/inventory/{id}/update HTTP/1.1
Host: your-api-url.com
Content-Type: application/json

{
    "product_name": "Shabu",
    "category": "Drugs",
    "size": "10g",
    "in_stock": 100,
    "cost": "1000.00",
    "price": "1000.00",
    "created_at": "2024-08-16T01:26:56.000Z",
    "updated_at": "2024-08-16T01:26:56.000Z"
}
```

### `POST /api/inventory/{id}/delete`

Delete inventory

## Request

### Headers

- **Content-Type**: `application/json`

### Body Parameters

N/A

### Example Request

N/A

```