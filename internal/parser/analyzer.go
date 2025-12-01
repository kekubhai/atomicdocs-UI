package parser

import (
	"regexp"
	"strings"
	"github.com/yourusername/atomicdocs/internal/types"
)

func AnalyzeRoute(route types.RouteInfo, schemaFiles map[string]string) types.RouteInfo {
	route.Summary = route.Method + " " + route.Path
	route.Tags = extractTags(route.Path)
	
	// Extract all parameter types
	route.Parameters = extractAllParameters(route)
	
	// Extract request body for POST, PUT, PATCH
	if route.Method == "POST" || route.Method == "PUT" || route.Method == "PATCH" {
		route.RequestBody = extractRequestBodyWithSchemas(route, schemaFiles)
	}
	
	// Extract responses with content types
	route.Responses = extractResponses(route)
	
	// Extract security requirements (auth tokens, etc.)
	route.Security = extractSecurity(route)
	
	return route
}

func extractTags(path string) []string {
	// Extract tag from first path segment
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) > 0 && parts[0] != "" {
		tag := parts[0]
		// Capitalize first letter
		if len(tag) > 0 {
			tag = strings.ToUpper(tag[:1]) + tag[1:]
		}
		return []string{tag}
	}
	return []string{"Default"}
}

func extractAllParameters(route types.RouteInfo) []types.Parameter {
	params := []types.Parameter{}
	
	// 1. Path parameters
	params = append(params, extractPathParams(route.Path)...)
	
	// 2. Query parameters
	params = append(params, extractQueryParams(route.Handler)...)
	
	// 3. Header parameters (excluding Authorization - that goes in security)
	params = append(params, extractHeaderParams(route.Handler)...)
	
	// 4. Cookie parameters
	params = append(params, extractCookieParams(route.Handler)...)
	
	return params
}

func extractPathParams(path string) []types.Parameter {
	params := []types.Parameter{}
	
	// Pattern 1: :param
	re1 := regexp.MustCompile(`:(\w+)`)
	for _, match := range re1.FindAllStringSubmatch(path, -1) {
		params = append(params, types.Parameter{
			Name:     match[1],
			In:       "path",
			Required: true,
			Schema:   types.Schema{Type: "string"},
		})
	}
	
	// Pattern 2: {param}
	re2 := regexp.MustCompile(`\{(\w+)\}`)
	for _, match := range re2.FindAllStringSubmatch(path, -1) {
		params = append(params, types.Parameter{
			Name:     match[1],
			In:       "path",
			Required: true,
			Schema:   types.Schema{Type: "string"},
		})
	}
	
	return params
}

func extractQueryParams(handler string) []types.Parameter {
	params := []types.Parameter{}
	seen := make(map[string]bool)
	
	// Pattern 1: const { x, y } = req.query
	re1 := regexp.MustCompile(`(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=\s*req\.query`)
	if matches := re1.FindStringSubmatch(handler); len(matches) >= 2 {
		for _, field := range splitFields(matches[1]) {
			if !seen[field] {
				seen[field] = true
				fieldType, example := inferType(field)
				params = append(params, types.Parameter{
					Name:    field,
					In:      "query",
					Schema:  types.Schema{Type: fieldType},
					Example: example,
				})
			}
		}
	}
	
	// Pattern 2: req.query.field
	re2 := regexp.MustCompile(`req\.query\.(\w+)`)
	for _, match := range re2.FindAllStringSubmatch(handler, -1) {
		field := match[1]
		if !seen[field] {
			seen[field] = true
			fieldType, example := inferType(field)
			params = append(params, types.Parameter{
				Name:    field,
				In:      "query",
				Schema:  types.Schema{Type: fieldType},
				Example: example,
			})
		}
	}
	
	// Pattern 3: req.query['field'] or req.query["field"]
	re3 := regexp.MustCompile(`req\.query\[['"](\w+)['"]\]`)
	for _, match := range re3.FindAllStringSubmatch(handler, -1) {
		field := match[1]
		if !seen[field] {
			seen[field] = true
			fieldType, example := inferType(field)
			params = append(params, types.Parameter{
				Name:    field,
				In:      "query",
				Schema:  types.Schema{Type: fieldType},
				Example: example,
			})
		}
	}
	
	// Pattern 4: c.req.query('field') - Hono
	re4 := regexp.MustCompile(`c\.req\.query\(['"](\w+)['"]\)`)
	for _, match := range re4.FindAllStringSubmatch(handler, -1) {
		field := match[1]
		if !seen[field] {
			seen[field] = true
			fieldType, example := inferType(field)
			params = append(params, types.Parameter{
				Name:    field,
				In:      "query",
				Schema:  types.Schema{Type: fieldType},
				Example: example,
			})
		}
	}
	
	return params
}

func extractHeaderParams(handler string) []types.Parameter {
	params := []types.Parameter{}
	seen := make(map[string]bool)
	
	// Skip Authorization header - it's handled by security
	authHeaders := map[string]bool{
		"authorization": true, "auth": true, "token": true,
		"x-auth-token": true, "x-access-token": true,
	}
	
	// Pattern 1: req.headers['header-name'] or req.headers["header-name"]
	re1 := regexp.MustCompile(`req\.headers\[['"]([^'"]+)['"]\]`)
	for _, match := range re1.FindAllStringSubmatch(handler, -1) {
		header := match[1]
		headerLower := strings.ToLower(header)
		if !seen[header] && !authHeaders[headerLower] {
			seen[header] = true
			params = append(params, types.Parameter{
				Name:   header,
				In:     "header",
				Schema: types.Schema{Type: "string"},
			})
		}
	}
	
	// Pattern 2: req.get('header-name')
	re2 := regexp.MustCompile(`req\.get\(['"]([^'"]+)['"]\)`)
	for _, match := range re2.FindAllStringSubmatch(handler, -1) {
		header := match[1]
		headerLower := strings.ToLower(header)
		if !seen[header] && !authHeaders[headerLower] {
			seen[header] = true
			params = append(params, types.Parameter{
				Name:   header,
				In:     "header",
				Schema: types.Schema{Type: "string"},
			})
		}
	}
	
	// Pattern 3: req.header('header-name') - Hono/Express
	re3 := regexp.MustCompile(`(?:req|c\.req)\.header\(['"]([^'"]+)['"]\)`)
	for _, match := range re3.FindAllStringSubmatch(handler, -1) {
		header := match[1]
		headerLower := strings.ToLower(header)
		if !seen[header] && !authHeaders[headerLower] {
			seen[header] = true
			params = append(params, types.Parameter{
				Name:   header,
				In:     "header",
				Schema: types.Schema{Type: "string"},
			})
		}
	}
	
	return params
}

func extractCookieParams(handler string) []types.Parameter {
	params := []types.Parameter{}
	seen := make(map[string]bool)
	
	// Pattern 1: req.cookies.cookieName or req.cookies['cookieName']
	re1 := regexp.MustCompile(`req\.cookies\.(\w+)`)
	for _, match := range re1.FindAllStringSubmatch(handler, -1) {
		cookie := match[1]
		if !seen[cookie] {
			seen[cookie] = true
			params = append(params, types.Parameter{
				Name:   cookie,
				In:     "cookie",
				Schema: types.Schema{Type: "string"},
			})
		}
	}
	
	// Pattern 2: req.cookies['cookie-name']
	re2 := regexp.MustCompile(`req\.cookies\[['"]([^'"]+)['"]\]`)
	for _, match := range re2.FindAllStringSubmatch(handler, -1) {
		cookie := match[1]
		if !seen[cookie] {
			seen[cookie] = true
			params = append(params, types.Parameter{
				Name:   cookie,
				In:     "cookie",
				Schema: types.Schema{Type: "string"},
			})
		}
	}
	
	// Pattern 3: getCookie('name') - Hono
	re3 := regexp.MustCompile(`getCookie\(['"]([^'"]+)['"]\)`)
	for _, match := range re3.FindAllStringSubmatch(handler, -1) {
		cookie := match[1]
		if !seen[cookie] {
			seen[cookie] = true
			params = append(params, types.Parameter{
				Name:   cookie,
				In:     "cookie",
				Schema: types.Schema{Type: "string"},
			})
		}
	}
	
	return params
}

func extractSecurity(route types.RouteInfo) []types.SecurityRequirement {
	handler := route.Handler
	
	// Check for auth-related patterns
	authPatterns := []string{
		`req\.headers\[['"]authorization['"]\]`,
		`req\.headers\.authorization`,
		`req\.get\(['"]authorization['"]\)`,
		`req\.header\(['"]authorization['"]\)`,
		`c\.req\.header\(['"]authorization['"]\)`,
		`Bearer\s+`,
		`jwt\.verify`,
		`verifyToken`,
		`authenticate`,
		`isAuthenticated`,
		`requireAuth`,
		`authMiddleware`,
		`req\.user`,
		`req\.userId`,
		`c\.get\(['"]user['"]\)`,
	}
	
	for _, pattern := range authPatterns {
		re := regexp.MustCompile(pattern)
		if re.MatchString(handler) {
			return []types.SecurityRequirement{
				{"bearerAuth": []string{}},
			}
		}
	}
	
	// Check for API key patterns
	apiKeyPatterns := []string{
		`x-api-key`,
		`apiKey`,
		`api_key`,
	}
	
	for _, pattern := range apiKeyPatterns {
		if strings.Contains(strings.ToLower(handler), strings.ToLower(pattern)) {
			return []types.SecurityRequirement{
				{"apiKeyAuth": []string{}},
			}
		}
	}
	
	return nil
}

func extractResponses(route types.RouteInfo) map[string]types.Response {
	responses := make(map[string]types.Response)
	handler := route.Handler
	
	// Analyze handler for response patterns
	hasSuccess := false
	hasCreated := false
	hasBadRequest := false
	hasUnauthorized := false
	hasNotFound := false
	hasServerError := false
	
	// Check for specific status codes
	statusPatterns := map[string]*bool{
		`\.status\(200\)`:  &hasSuccess,
		`\.status\(201\)`:  &hasCreated,
		`\.status\(400\)`:  &hasBadRequest,
		`\.status\(401\)`:  &hasUnauthorized,
		`\.status\(404\)`:  &hasNotFound,
		`\.status\(500\)`:  &hasServerError,
		`res\.json`:        &hasSuccess,
		`c\.json`:          &hasSuccess,
		`return.*json`:     &hasSuccess,
	}
	
	for pattern, flag := range statusPatterns {
		re := regexp.MustCompile(pattern)
		if re.MatchString(handler) {
			*flag = true
		}
	}
	
	// Extract response body schema from res.json() or return c.json()
	responseSchema := extractResponseSchema(handler)
	
	// Build responses based on what we found
	if hasSuccess || route.Method == "GET" {
		resp := types.Response{Description: "Successful response"}
		if responseSchema != nil {
			resp.Content = map[string]types.MediaTypeObject{
				"application/json": {Schema: *responseSchema},
			}
		}
		responses["200"] = resp
	}
	
	if hasCreated || route.Method == "POST" {
		resp := types.Response{Description: "Created successfully"}
		if responseSchema != nil && route.Method == "POST" {
			resp.Content = map[string]types.MediaTypeObject{
				"application/json": {Schema: *responseSchema},
			}
		}
		responses["201"] = resp
	}
	
	if hasBadRequest || route.Method == "POST" || route.Method == "PUT" || route.Method == "PATCH" {
		responses["400"] = types.Response{
			Description: "Bad request",
			Content: map[string]types.MediaTypeObject{
				"application/json": {
					Schema: types.Schema{
						Type: "object",
						Properties: map[string]types.Schema{
							"error": {Type: "string", Example: "Invalid input"},
						},
					},
				},
			},
		}
	}
	
	if hasUnauthorized || extractSecurity(route) != nil {
		responses["401"] = types.Response{
			Description: "Unauthorized",
			Content: map[string]types.MediaTypeObject{
				"application/json": {
					Schema: types.Schema{
						Type: "object",
						Properties: map[string]types.Schema{
							"error": {Type: "string", Example: "Unauthorized"},
						},
					},
				},
			},
		}
	}
	
	if hasNotFound || strings.Contains(route.Path, ":") || strings.Contains(route.Path, "{") {
		responses["404"] = types.Response{
			Description: "Not found",
			Content: map[string]types.MediaTypeObject{
				"application/json": {
					Schema: types.Schema{
						Type: "object",
						Properties: map[string]types.Schema{
							"error": {Type: "string", Example: "Resource not found"},
						},
					},
				},
			},
		}
	}
	
	// Default responses if none detected
	if len(responses) == 0 {
		responses["200"] = types.Response{Description: "Successful response"}
	}
	
	return responses
}

func extractResponseSchema(handler string) *types.Schema {
	properties := make(map[string]types.Schema)
	example := make(map[string]interface{})
	
	// Pattern 1: res.json({ field: value, ... })
	re1 := regexp.MustCompile(`(?:res\.json|c\.json|return\s+c\.json)\s*\(\s*\{([^}]+)\}`)
	if matches := re1.FindStringSubmatch(handler); len(matches) >= 2 {
		fields := extractObjectFields(matches[1])
		for _, field := range fields {
			fieldType, exampleVal := inferType(field)
			properties[field] = types.Schema{Type: fieldType}
			example[field] = exampleVal
		}
	}
	
	// Pattern 2: return { field: value }
	re2 := regexp.MustCompile(`return\s+\{([^}]+)\}`)
	if matches := re2.FindStringSubmatch(handler); len(matches) >= 2 {
		fields := extractObjectFields(matches[1])
		for _, field := range fields {
			if _, exists := properties[field]; !exists {
				fieldType, exampleVal := inferType(field)
				properties[field] = types.Schema{Type: fieldType}
				example[field] = exampleVal
			}
		}
	}
	
	if len(properties) == 0 {
		return nil
	}
	
	return &types.Schema{
		Type:       "object",
		Properties: properties,
		Example:    example,
	}
}

func extractObjectFields(objStr string) []string {
	fields := []string{}
	
	// Match field names in object literal: { field: ..., field2: ... }
	re := regexp.MustCompile(`(\w+)\s*:`)
	for _, match := range re.FindAllStringSubmatch(objStr, -1) {
		field := match[1]
		// Skip common non-field patterns
		if field != "status" && field != "headers" && field != "body" {
			fields = append(fields, field)
		}
	}
	
	return fields
}

func splitFields(paramStr string) []string {
	fields := []string{}
	params := strings.Split(paramStr, ",")
	for _, param := range params {
		param = strings.TrimSpace(param)
		// Handle renaming: oldName: newName
		if idx := strings.Index(param, ":"); idx > 0 {
			param = strings.TrimSpace(param[:idx])
		}
		if param != "" && !strings.Contains(param, "...") {
			fields = append(fields, param)
		}
	}
	return fields
}

func extractRequestBodyWithSchemas(route types.RouteInfo, schemaFiles map[string]string) *types.RequestBody {
	// First, try to find schema from imports
	for _, imp := range route.Imports {
		// Skip framework imports
		if imp.From == "express" || imp.From == "zod" || imp.From == "hono" || 
		   strings.Contains(imp.From, "node_modules") {
			continue
		}
		
		for filePath, fileContent := range schemaFiles {
			// Normalize paths for comparison
			importFile := strings.TrimSuffix(imp.From, ".ts")
			importFile = strings.TrimSuffix(importFile, ".js")
			importFile = strings.Replace(importFile, "../", "", -1)
			importFile = strings.Replace(importFile, "./", "", -1)
			
			// Check if filePath contains the import path
			if strings.Contains(filePath, importFile) {
				properties := ParseSchemaFromFile(imp.Name, fileContent)
				if len(properties) > 0 {
					example := make(map[string]interface{})
					for field := range properties {
						_, exampleValue := inferType(field)
						example[field] = exampleValue
					}
					
					return &types.RequestBody{
						Required: true,
						Content: map[string]types.MediaTypeObject{
							"application/json": {
								Schema: types.Schema{
									Type:       "object",
									Properties: properties,
									Example:    example,
								},
							},
						},
					}
				}
			}
		}
	}
	
	// Try to find inline schema in handler code
	if inlineSchema := extractInlineSchema(route.Handler); inlineSchema != nil {
		return inlineSchema
	}
	
	// Fallback to regex extraction
	return extractRequestBody(route.Handler)
}

func extractInlineSchema(handler string) *types.RequestBody {
	// Pattern: const SchemaName = z.object({ ... })
	// Then: SchemaName.parse(req.body) or SchemaName.safeParse(req.body)
	
	// Find schema definition in handler
	schemaPattern := regexp.MustCompile(`(?s)const\s+(\w+)\s*=\s*z\.object\(\{(.+?)\}\)`)
	matches := schemaPattern.FindStringSubmatch(handler)
	
	if len(matches) < 3 {
		return nil
	}
	
	schemaName := matches[1]
	schemaBody := matches[2]
	
	// Check if this schema is used with req.body
	usagePattern := regexp.MustCompile(schemaName + `\.(?:safe)?[Pp]arse\(req\.body\)`)
	if !usagePattern.MatchString(handler) {
		return nil
	}
	
	// Parse fields from schema body
	properties := make(map[string]types.Schema)
	example := make(map[string]interface{})
	
	fieldPattern := regexp.MustCompile(`(\w+)\s*:\s*z\.(\w+)\(\)`)
	fieldMatches := fieldPattern.FindAllStringSubmatch(schemaBody, -1)
	
	for _, match := range fieldMatches {
		fieldName := match[1]
		zodType := match[2]
		
		properties[fieldName] = types.Schema{
			Type: zodTypeToOpenAPI(zodType),
		}
		
		_, exampleValue := inferType(fieldName)
		example[fieldName] = exampleValue
	}
	
	if len(properties) == 0 {
		return nil
	}
	
	return &types.RequestBody{
		Required: true,
		Content: map[string]types.MediaTypeObject{
			"application/json": {
				Schema: types.Schema{
					Type:       "object",
					Properties: properties,
					Example:    example,
				},
			},
		},
	}
}

func extractRequestBody(handler string) *types.RequestBody {
	if handler == "" {
		return createEmptyBody()
	}
	
	fields := make(map[string]bool)
	
	// Pattern 1: const { x, y, z } = req.body
	re1 := regexp.MustCompile(`(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=\s*req\.body`)
	if matches := re1.FindStringSubmatch(handler); len(matches) >= 2 {
		addFields(fields, matches[1])
	}
	
	// Pattern 2: const { x, y } = await c.req.json()
	re2 := regexp.MustCompile(`(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=\s*await\s+c\.req\.json\(\)`)
	if matches := re2.FindStringSubmatch(handler); len(matches) >= 2 {
		addFields(fields, matches[1])
	}
	
	// Pattern 3: const { x, y } = c.req.json()
	re3 := regexp.MustCompile(`(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=\s*c\.req\.json\(\)`)
	if matches := re3.FindStringSubmatch(handler); len(matches) >= 2 {
		addFields(fields, matches[1])
	}
	
	// Pattern 4: const body = req.body; then { x, y } = body
	bodyVarRe := regexp.MustCompile(`(?:const|let|var)\s+(\w+)\s*=\s*req\.body`)
	if bodyMatches := bodyVarRe.FindStringSubmatch(handler); len(bodyMatches) >= 2 {
		bodyVar := bodyMatches[1]
		destructRe := regexp.MustCompile(`\{\s*([^}]+)\s*\}\s*=\s*` + bodyVar)
		if destructMatches := destructRe.FindStringSubmatch(handler); len(destructMatches) >= 2 {
			addFields(fields, destructMatches[1])
		}
	}
	
	// Pattern 5: req.body.field
	re5 := regexp.MustCompile(`req\.body\.(\w+)`)
	for _, match := range re5.FindAllStringSubmatch(handler, -1) {
		fields[match[1]] = true
	}
	
	// Pattern 6: body.field
	re6 := regexp.MustCompile(`\bbody\.(\w+)`)
	for _, match := range re6.FindAllStringSubmatch(handler, -1) {
		if !isExcludedField(match[1]) {
			fields[match[1]] = true
		}
	}
	
	// Pattern 7: parsedData.data.field (Zod)
	re7 := regexp.MustCompile(`parsedData\.data\.(\w+)`)
	for _, match := range re7.FindAllStringSubmatch(handler, -1) {
		fields[match[1]] = true
	}
	
	// Pattern 8: validated.data.field
	re8 := regexp.MustCompile(`validated\.data\.(\w+)`)
	for _, match := range re8.FindAllStringSubmatch(handler, -1) {
		fields[match[1]] = true
	}
	
	// Pattern 9: data.field
	re9 := regexp.MustCompile(`\bdata\.(\w+)`)
	for _, match := range re9.FindAllStringSubmatch(handler, -1) {
		if !isExcludedField(match[1]) {
			fields[match[1]] = true
		}
	}
	
	// Pattern 10: input.field
	re10 := regexp.MustCompile(`\binput\.(\w+)`)
	for _, match := range re10.FindAllStringSubmatch(handler, -1) {
		if !isExcludedField(match[1]) {
			fields[match[1]] = true
		}
	}
	
	// Pattern 11: payload.field
	re11 := regexp.MustCompile(`\bpayload\.(\w+)`)
	for _, match := range re11.FindAllStringSubmatch(handler, -1) {
		if !isExcludedField(match[1]) {
			fields[match[1]] = true
		}
	}
	
	// Pattern 12: params.field
	re12 := regexp.MustCompile(`\bparams\.(\w+)`)
	for _, match := range re12.FindAllStringSubmatch(handler, -1) {
		if !isExcludedField(match[1]) {
			fields[match[1]] = true
		}
	}
	
	if len(fields) == 0 {
		return createEmptyBody()
	}
	
	return buildRequestBody(fields)
}

func isExcludedField(field string) bool {
	excluded := map[string]bool{
		"json": true, "text": true, "success": true, "error": true,
		"message": true, "status": true, "length": true, "toString": true,
		"valueOf": true, "constructor": true, "hasOwnProperty": true,
	}
	return excluded[field]
}

func addFields(fieldMap map[string]bool, paramStr string) {
	params := strings.Split(paramStr, ",")
	for _, param := range params {
		param = strings.TrimSpace(param)
		if param != "" && !strings.Contains(param, "...") {
			fieldMap[param] = true
		}
	}
}

func inferType(field string) (string, interface{}) {
	field = strings.ToLower(field)
	
	// Integer types
	if field == "age" || field == "count" || field == "quantity" || field == "stock" || 
	   field == "limit" || field == "offset" || field == "page" || field == "size" ||
	   strings.HasSuffix(field, "id") || strings.HasSuffix(field, "count") {
		return "integer", 1
	}
	
	// Number types
	if field == "price" || field == "amount" || field == "total" || field == "balance" ||
	   field == "rating" || field == "score" || strings.HasSuffix(field, "price") {
		return "number", 99.99
	}
	
	// Boolean types
	if field == "active" || field == "enabled" || field == "verified" || field == "published" ||
	   strings.HasPrefix(field, "is") || strings.HasPrefix(field, "has") {
		return "boolean", true
	}
	
	// Array types
	if strings.HasSuffix(field, "s") && (field == "tags" || field == "items" || field == "ids" || 
	   field == "actions" || field == "roles" || field == "permissions") {
		return "array", []string{"item1", "item2"}
	}
	
	// String types with smart examples
	return "string", getStringExample(field)
}

func getStringExample(field string) string {
	switch field {
	case "password":
		return "secret123"
	case "email", "username":
		return "user@example.com"
	case "name", "firstname", "lastname", "fullname":
		return "John Doe"
	case "phone", "mobile":
		return "+1234567890"
	case "address":
		return "123 Main St"
	case "city":
		return "New York"
	case "country":
		return "USA"
	case "zipcode", "zip", "postalcode":
		return "10001"
	case "token":
		return "abc123token"
	case "url", "website":
		return "https://example.com"
	case "description", "bio":
		return "Sample description"
	case "title":
		return "Sample Title"
	case "category":
		return "general"
	case "status":
		return "active"
	case "role":
		return "user"
	case "code":
		return "ABC123"
	default:
		return "example"
	}
}

func buildRequestBody(fields map[string]bool) *types.RequestBody {
	properties := make(map[string]types.Schema)
	example := make(map[string]interface{})
	
	for field := range fields {
		fieldType, exampleValue := inferType(field)
		
		if fieldType == "array" {
			properties[field] = types.Schema{
				Type: "array",
				Items: &types.Schema{Type: "string"},
			}
		} else {
			properties[field] = types.Schema{Type: fieldType}
		}
		
		example[field] = exampleValue
	}
	
	return &types.RequestBody{
		Required: true,
		Content: map[string]types.MediaTypeObject{
			"application/json": {
				Schema: types.Schema{
					Type:       "object",
					Properties: properties,
					Example:    example,
				},
			},
		},
	}
}

func createEmptyBody() *types.RequestBody {
	return &types.RequestBody{
		Required: true,
		Content: map[string]types.MediaTypeObject{
			"application/json": {
				Schema: types.Schema{
					Type:    "object",
					Example: map[string]interface{}{},
				},
			},
		},
	}
}
