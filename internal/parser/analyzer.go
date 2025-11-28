package parser

import (
	"regexp"
	"strings"
	"github.com/yourusername/atomicdocs/internal/types"
)

func AnalyzeRoute(route types.RouteInfo) types.RouteInfo {
	route.Summary = route.Method + " " + route.Path
	route.Parameters = extractPathParams(route.Path)
	
	if route.Method == "POST" || route.Method == "PUT" || route.Method == "PATCH" {
		route.RequestBody = extractRequestBody(route.Handler)
	}
	
	route.Responses = map[string]types.Response{
		"200": {Description: "Successful response"},
		"201": {Description: "Created"},
		"400": {Description: "Bad request"},
		"401": {Description: "Unauthorized"},
		"404": {Description: "Not found"},
	}
	
	return route
}

func extractPathParams(path string) []types.Parameter {
	params := []types.Parameter{}
	re := regexp.MustCompile(`:(\w+)`)
	matches := re.FindAllStringSubmatch(path, -1)
	
	for _, match := range matches {
		params = append(params, types.Parameter{
			Name:     match[1],
			In:       "path",
			Required: true,
			Schema:   types.Schema{Type: "string"},
		})
	}
	
	return params
}

func extractRequestBody(handler string) *types.RequestBody {
	if handler == "" {
		return nil
	}
	
	// Multiple patterns to match different coding styles
	patterns := []string{
		`const\s*{\s*([^}]+)\s*}\s*=\s*req\.body`,           // Express: const { x } = req.body
		`const\s*{\s*([^}]+)\s*}\s*=\s*await\s+c\.req\.json\(\)`, // Hono: const { x } = await c.req.json()
		`const\s*{\s*([^}]+)\s*}\s*=\s*c\.req\.json\(\)`,    // Hono: const { x } = c.req.json()
		`{\s*([^}]+)\s*}\s*=\s*await\s+c\.req\.json`,        // Hono variant
	}
	
	var paramStr string
	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(handler)
		if len(matches) >= 2 {
			paramStr = matches[1]
			break
		}
	}
	
	if paramStr == "" {
		return nil
	}
	
	params := strings.Split(paramStr, ",")
	properties := make(map[string]types.Schema)
	example := make(map[string]interface{})
	
	for _, param := range params {
		param = strings.TrimSpace(param)
		if param == "" {
			continue
		}
		
		// Determine type based on parameter name
		if param == "age" || param == "quantity" || param == "stock" || strings.HasSuffix(param, "Id") || strings.HasSuffix(param, "ID") {
			properties[param] = types.Schema{Type: "integer"}
			example[param] = 1
		} else if param == "price" {
			properties[param] = types.Schema{Type: "number"}
			example[param] = 99.99
		} else {
			properties[param] = types.Schema{Type: "string"}
			
			// Smart examples
			if param == "password" {
				example[param] = "secret123"
			} else if param == "email" {
				example[param] = "user@example.com"
			} else if param == "username" || param == "name" {
				example[param] = "John Doe"
			} else if param == "category" {
				example[param] = "general"
			} else if param == "status" {
				example[param] = "active"
			} else {
				example[param] = "example"
			}
		}
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
