export interface MockEndpoint {
  method: string;
  path: string;
  summary: string;
  description: string;
  tags?: string[];
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    description?: string;
    schema?: { type: string; example?: unknown };
  }>;
  requestBody?: {
    schema: Record<string, unknown>;
    example?: unknown;
  };
  responses: Record<string, { description: string; example?: unknown }>;
  curlExample?: string;
  codeExample?: string;
}

export const mockApis: MockEndpoint[] = [
  {
    method: "GET",
    path: "/api/v1/users",
    summary: "List all users",
    description: "Retrieve a paginated list of all users in the system. Supports filtering by role, status, and search query.",
    tags: ["Users"],
    parameters: [
      { name: "page", in: "query", required: false, description: "Page number (default: 1)", schema: { type: "integer", example: 1 } },
      { name: "limit", in: "query", required: false, description: "Items per page (default: 20)", schema: { type: "integer", example: 20 } },
      { name: "role", in: "query", required: false, description: "Filter by user role", schema: { type: "string", example: "admin" } },
      { name: "status", in: "query", required: false, description: "Filter by account status", schema: { type: "string", example: "active" } },
    ],
    responses: {
      "200": {
        description: "Successful response with user list",
        example: {
          data: [{ id: 1, name: "John Doe", email: "john@example.com", role: "user" }],
          pagination: { page: 1, limit: 20, total: 100 }
        }
      },
      "401": { description: "Unauthorized - Invalid or missing authentication token" },
      "500": { description: "Internal server error" }
    },
    curlExample: 'curl -X GET "https://api.example.com/api/v1/users?page=1&limit=20" -H "Authorization: Bearer YOUR_TOKEN"',
    codeExample: `fetch('https://api.example.com/api/v1/users?page=1&limit=20', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(res => res.json())
.then(data => console.log(data));`
  },
  {
    method: "POST",
    path: "/api/v1/users",
    summary: "Create a new user",
    description: "Register a new user account with email, password, and optional profile information.",
    tags: ["Users"],
    requestBody: {
      schema: {
        type: "object",
        required: ["email", "password", "name"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          name: { type: "string" },
          role: { type: "string", enum: ["user", "admin"], default: "user" }
        }
      },
      example: {
        email: "newuser@example.com",
        password: "securePassword123",
        name: "Jane Doe",
        role: "user"
      }
    },
    responses: {
      "201": {
        description: "User created successfully",
        example: { id: 123, email: "newuser@example.com", name: "Jane Doe", createdAt: "2024-01-15T10:30:00Z" }
      },
      "400": { description: "Bad request - Validation error" },
      "409": { description: "Conflict - Email already exists" }
    },
    curlExample: 'curl -X POST "https://api.example.com/api/v1/users" -H "Content-Type: application/json" -d \'{"email":"newuser@example.com","password":"securePassword123","name":"Jane Doe"}\'',
  },
  {
    method: "GET",
    path: "/api/v1/users/{id}",
    summary: "Get user by ID",
    description: "Retrieve detailed information about a specific user by their unique identifier.",
    tags: ["Users"],
    parameters: [
      { name: "id", in: "path", required: true, description: "User ID", schema: { type: "integer", example: 1 } }
    ],
    responses: {
      "200": {
        description: "User details",
        example: { id: 1, name: "John Doe", email: "john@example.com", role: "user", createdAt: "2024-01-01T00:00:00Z" }
      },
      "404": { description: "User not found" }
    }
  },
  {
    method: "PUT",
    path: "/api/v1/users/{id}",
    summary: "Update user",
    description: "Update an existing user's information. All fields are optional - only provided fields will be updated.",
    tags: ["Users"],
    parameters: [
      { name: "id", in: "path", required: true, description: "User ID", schema: { type: "integer" } }
    ],
    requestBody: {
      schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["user", "admin"] }
        }
      },
      example: { name: "John Updated", email: "john.updated@example.com" }
    },
    responses: {
      "200": { description: "User updated successfully" },
      "404": { description: "User not found" },
      "400": { description: "Validation error" }
    }
  },
  {
    method: "DELETE",
    path: "/api/v1/users/{id}",
    summary: "Delete user",
    description: "Permanently delete a user account. This action cannot be undone.",
    tags: ["Users"],
    parameters: [
      { name: "id", in: "path", required: true, description: "User ID", schema: { type: "integer" } }
    ],
    responses: {
      "204": { description: "User deleted successfully" },
      "404": { description: "User not found" },
      "403": { description: "Forbidden - Cannot delete admin users" }
    }
  },
  {
    method: "GET",
    path: "/api/v1/products",
    summary: "List products",
    description: "Get a paginated list of products with optional filtering by category, price range, and availability.",
    tags: ["Products"],
    parameters: [
      { name: "category", in: "query", required: false, description: "Filter by category", schema: { type: "string", example: "electronics" } },
      { name: "minPrice", in: "query", required: false, description: "Minimum price", schema: { type: "number", example: 10 } },
      { name: "maxPrice", in: "query", required: false, description: "Maximum price", schema: { type: "number", example: 1000 } },
      { name: "inStock", in: "query", required: false, description: "Filter by stock availability", schema: { type: "boolean", example: true } },
    ],
    responses: {
      "200": {
        description: "Product list",
        example: {
          data: [{ id: 1, name: "Laptop", price: 999.99, category: "electronics", inStock: true }],
          total: 50
        }
      }
    }
  },
  {
    method: "POST",
    path: "/api/v1/products",
    summary: "Create product",
    description: "Add a new product to the catalog. Requires admin privileges.",
    tags: ["Products"],
    requestBody: {
      schema: {
        type: "object",
        required: ["name", "price", "category"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number", minimum: 0 },
          category: { type: "string" },
          stock: { type: "integer", minimum: 0 },
          images: { type: "array", items: { type: "string", format: "uri" } }
        }
      },
      example: {
        name: "Wireless Mouse",
        description: "Ergonomic wireless mouse with 2-year battery",
        price: 29.99,
        category: "electronics",
        stock: 100,
        images: ["https://example.com/mouse.jpg"]
      }
    },
    responses: {
      "201": { description: "Product created" },
      "401": { description: "Unauthorized" },
      "403": { description: "Forbidden - Admin only" }
    }
  },
  {
    method: "GET",
    path: "/api/v1/products/{id}",
    summary: "Get product details",
    description: "Retrieve detailed information about a specific product including reviews and related items.",
    tags: ["Products"],
    parameters: [
      { name: "id", in: "path", required: true, description: "Product ID", schema: { type: "integer" } }
    ],
    responses: {
      "200": {
        description: "Product details",
        example: {
          id: 1,
          name: "Laptop",
          price: 999.99,
          description: "High-performance laptop",
          category: "electronics",
          inStock: true,
          reviews: []
        }
      },
      "404": { description: "Product not found" }
    }
  },
  {
    method: "GET",
    path: "/api/v1/orders",
    summary: "List orders",
    description: "Retrieve orders for the authenticated user. Admins can view all orders.",
    tags: ["Orders"],
    parameters: [
      { name: "status", in: "query", required: false, description: "Filter by order status", schema: { type: "string", example: "pending" } },
      { name: "from", in: "query", required: false, description: "Start date (ISO 8601)", schema: { type: "string", example: "2024-01-01" } },
      { name: "to", in: "query", required: false, description: "End date (ISO 8601)", schema: { type: "string", example: "2024-12-31" } },
    ],
    responses: {
      "200": {
        description: "Order list",
        example: {
          data: [{
            id: 1,
            userId: 123,
            items: [{ productId: 1, quantity: 2, price: 999.99 }],
            total: 1999.98,
            status: "pending",
            createdAt: "2024-01-15T10:00:00Z"
          }]
        }
      }
    }
  },
  {
    method: "POST",
    path: "/api/v1/orders",
    summary: "Create order",
    description: "Create a new order from the shopping cart. Validates inventory and applies discounts.",
    tags: ["Orders"],
    requestBody: {
      schema: {
        type: "object",
        required: ["items", "shippingAddress"],
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["productId", "quantity"],
              properties: {
                productId: { type: "integer" },
                quantity: { type: "integer", minimum: 1 }
              }
            }
          },
          shippingAddress: { type: "object" },
          paymentMethod: { type: "string" },
          couponCode: { type: "string" }
        }
      },
      example: {
        items: [{ productId: 1, quantity: 2 }],
        shippingAddress: { street: "123 Main St", city: "New York", zip: "10001" },
        paymentMethod: "credit_card",
        couponCode: "SAVE10"
      }
    },
    responses: {
      "201": { description: "Order created" },
      "400": { description: "Invalid order data or insufficient stock" },
      "401": { description: "Unauthorized" }
    }
  },
  {
    method: "GET",
    path: "/api/v1/orders/{id}",
    summary: "Get order details",
    description: "Retrieve detailed information about a specific order including items, shipping, and tracking.",
    tags: ["Orders"],
    parameters: [
      { name: "id", in: "path", required: true, description: "Order ID", schema: { type: "integer" } }
    ],
    responses: {
      "200": { description: "Order details" },
      "404": { description: "Order not found" },
      "403": { description: "Forbidden - Can only view own orders" }
    }
  },
  {
    method: "PATCH",
    path: "/api/v1/orders/{id}/status",
    summary: "Update order status",
    description: "Update the status of an order. Only admins can change order status.",
    tags: ["Orders"],
    parameters: [
      { name: "id", in: "path", required: true, description: "Order ID", schema: { type: "integer" } }
    ],
    requestBody: {
      schema: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["pending", "processing", "shipped", "delivered", "cancelled"]
          }
        }
      },
      example: { status: "shipped" }
    },
    responses: {
      "200": { description: "Status updated" },
      "400": { description: "Invalid status transition" },
      "403": { description: "Forbidden - Admin only" }
    }
  },
  {
    method: "POST",
    path: "/api/v1/auth/login",
    summary: "User login",
    description: "Authenticate a user with email and password. Returns a JWT token for subsequent requests.",
    tags: ["Authentication"],
    requestBody: {
      schema: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" }
        }
      },
      example: {
        email: "user@example.com",
        password: "password123"
      }
    },
    responses: {
      "200": {
        description: "Login successful",
        example: {
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          user: { id: 1, email: "user@example.com", name: "John Doe" },
          expiresIn: 3600
        }
      },
      "401": { description: "Invalid credentials" }
    }
  },
  {
    method: "POST",
    path: "/api/v1/auth/register",
    summary: "User registration",
    description: "Register a new user account. Email verification may be required.",
    tags: ["Authentication"],
    requestBody: {
      schema: {
        type: "object",
        required: ["email", "password", "name"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          name: { type: "string" }
        }
      },
      example: {
        email: "newuser@example.com",
        password: "securePassword123",
        name: "Jane Doe"
      }
    },
    responses: {
      "201": { description: "Registration successful" },
      "400": { description: "Validation error" },
      "409": { description: "Email already exists" }
    }
  },
  {
    method: "POST",
    path: "/api/v1/auth/refresh",
    summary: "Refresh token",
    description: "Get a new access token using a valid refresh token.",
    tags: ["Authentication"],
    requestBody: {
      schema: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" }
        }
      },
      example: { refreshToken: "refresh_token_here" }
    },
    responses: {
      "200": { description: "New token issued" },
      "401": { description: "Invalid refresh token" }
    }
  },
  {
    method: "GET",
    path: "/api/v1/analytics/dashboard",
    summary: "Get dashboard analytics",
    description: "Retrieve aggregated analytics data for the admin dashboard including sales, users, and product metrics.",
    tags: ["Analytics"],
    parameters: [
      { name: "period", in: "query", required: false, description: "Time period", schema: { type: "string", example: "7d" } },
      { name: "metric", in: "query", required: false, description: "Specific metric to retrieve", schema: { type: "string", example: "revenue" } },
    ],
    responses: {
      "200": {
        description: "Analytics data",
        example: {
          revenue: { total: 50000, change: 12.5 },
          users: { total: 1000, new: 50 },
          orders: { total: 200, pending: 10 }
        }
      },
      "403": { description: "Forbidden - Admin only" }
    }
  },
  {
    method: "GET",
    path: "/api/v1/analytics/reports",
    summary: "Generate report",
    description: "Generate a detailed analytics report for a specified date range. Available formats: JSON, CSV, PDF.",
    tags: ["Analytics"],
    parameters: [
      { name: "startDate", in: "query", required: true, description: "Start date (ISO 8601)", schema: { type: "string" } },
      { name: "endDate", in: "query", required: true, description: "End date (ISO 8601)", schema: { type: "string" } },
      { name: "format", in: "query", required: false, description: "Report format", schema: { type: "string", example: "json" } },
    ],
    responses: {
      "200": { description: "Report generated" },
      "400": { description: "Invalid date range" },
      "403": { description: "Forbidden - Admin only" }
    }
  },
  {
    method: "GET",
    path: "/api/v1/files",
    summary: "List files",
    description: "Retrieve a list of uploaded files with metadata. Supports filtering by type and date.",
    tags: ["Files"],
    parameters: [
      { name: "type", in: "query", required: false, description: "File type filter", schema: { type: "string", example: "image" } },
      { name: "userId", in: "query", required: false, description: "Filter by uploader", schema: { type: "integer" } },
    ],
    responses: {
      "200": {
        description: "File list",
        example: {
          data: [{
            id: 1,
            filename: "document.pdf",
            size: 1024000,
            type: "application/pdf",
            uploadedAt: "2024-01-15T10:00:00Z"
          }]
        }
      }
    }
  },
  {
    method: "POST",
    path: "/api/v1/files/upload",
    summary: "Upload file",
    description: "Upload a new file. Supports multipart/form-data. Maximum file size: 10MB.",
    tags: ["Files"],
    requestBody: {
      schema: {
        type: "object",
        required: ["file"],
        properties: {
          file: { type: "string", format: "binary" },
          description: { type: "string" },
          tags: { type: "array", items: { type: "string" } }
        }
      }
    },
    responses: {
      "201": {
        description: "File uploaded successfully",
        example: {
          id: 123,
          filename: "document.pdf",
          url: "https://cdn.example.com/files/document.pdf",
          size: 1024000
        }
      },
      "400": { description: "Invalid file or exceeds size limit" },
      "413": { description: "File too large" }
    }
  },
  {
    method: "GET",
    path: "/api/v1/notifications",
    summary: "Get notifications",
    description: "Retrieve notifications for the authenticated user. Supports pagination and filtering by read status.",
    tags: ["Notifications"],
    parameters: [
      { name: "unreadOnly", in: "query", required: false, description: "Show only unread notifications", schema: { type: "boolean", example: true } },
      { name: "type", in: "query", required: false, description: "Filter by notification type", schema: { type: "string", example: "order" } },
    ],
    responses: {
      "200": {
        description: "Notification list",
        example: {
          data: [{
            id: 1,
            title: "Order Shipped",
            message: "Your order #123 has been shipped",
            type: "order",
            read: false,
            createdAt: "2024-01-15T10:00:00Z"
          }],
          unreadCount: 5
        }
      }
    }
  },
  {
    method: "PATCH",
    path: "/api/v1/notifications/{id}/read",
    summary: "Mark notification as read",
    description: "Mark a specific notification as read.",
    tags: ["Notifications"],
    parameters: [
      { name: "id", in: "path", required: true, description: "Notification ID", schema: { type: "integer" } }
    ],
    responses: {
      "200": { description: "Notification marked as read" },
      "404": { description: "Notification not found" }
    }
  }
];
