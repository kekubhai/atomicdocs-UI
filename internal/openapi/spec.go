package openapi

import (
	"github.com/yourusername/atomicdocs/internal/types"
)

type Spec struct {
	OpenAPI    string                `json:"openapi"`
	Info       Info                  `json:"info"`
	Servers    []Server              `json:"servers"`
	Paths      map[string]PathItem   `json:"paths"`
	Components *Components           `json:"components,omitempty"`
}

type Info struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Version     string `json:"version"`
}

type Server struct {
	URL         string `json:"url"`
	Description string `json:"description,omitempty"`
}

type Components struct {
	Schemas         map[string]types.Schema         `json:"schemas,omitempty"`
	SecuritySchemes map[string]types.SecurityScheme `json:"securitySchemes,omitempty"`
}

type PathItem struct {
	Get    *Operation `json:"get,omitempty"`
	Post   *Operation `json:"post,omitempty"`
	Put    *Operation `json:"put,omitempty"`
	Delete *Operation `json:"delete,omitempty"`
	Patch  *Operation `json:"patch,omitempty"`
}

type Operation struct {
	Summary     string                       `json:"summary,omitempty"`
	Description string                       `json:"description,omitempty"`
	Tags        []string                     `json:"tags,omitempty"`
	Parameters  []types.Parameter            `json:"parameters,omitempty"`
	RequestBody *types.RequestBody           `json:"requestBody,omitempty"`
	Responses   map[string]types.Response    `json:"responses"`
	Security    []types.SecurityRequirement  `json:"security,omitempty"`
}

func Generate(routes []types.RouteInfo, baseURL string) *Spec {
	paths := make(map[string]PathItem)
	schemas := make(map[string]types.Schema)
	securitySchemes := make(map[string]types.SecurityScheme)
	
	for _, route := range routes {
		item := paths[route.Path]
		
		op := &Operation{
			Summary:     route.Summary,
			Description: route.Description,
			Tags:        route.Tags,
			Parameters:  route.Parameters,
			RequestBody: route.RequestBody,
			Responses:   route.Responses,
			Security:    route.Security,
		}
		
		if op.Responses == nil {
			op.Responses = map[string]types.Response{
				"200": {Description: "Successful response"},
				"400": {Description: "Bad request"},
				"404": {Description: "Not found"},
			}
		}
		
		// Collect security schemes from routes
		if route.Security != nil {
			for _, secReq := range route.Security {
				for secName := range secReq {
					if secName == "bearerAuth" {
						securitySchemes["bearerAuth"] = types.SecurityScheme{
							Type:         "http",
							Scheme:       "bearer",
							BearerFormat: "JWT",
							Description:  "JWT Bearer token authentication",
						}
					} else if secName == "apiKeyAuth" {
						securitySchemes["apiKeyAuth"] = types.SecurityScheme{
							Type:        "apiKey",
							In:          "header",
							Name:        "X-API-Key",
							Description: "API key authentication",
						}
					}
				}
			}
		}
		
		// Extract schemas from request body
		if route.RequestBody != nil {
			for contentType, mediaType := range route.RequestBody.Content {
				if contentType == "application/json" && mediaType.Schema.Properties != nil {
					schemaName := route.Method + route.Path
					schemaName = sanitizeSchemaName(schemaName)
					schemas[schemaName] = mediaType.Schema
				}
			}
		}
		
		switch route.Method {
		case "GET":
			item.Get = op
		case "POST":
			item.Post = op
		case "PUT":
			item.Put = op
		case "DELETE":
			item.Delete = op
		case "PATCH":
			item.Patch = op
		}
		paths[route.Path] = item
	}
	
	var components *Components
	if len(schemas) > 0 || len(securitySchemes) > 0 {
		components = &Components{}
		if len(schemas) > 0 {
			components.Schemas = schemas
		}
		if len(securitySchemes) > 0 {
			components.SecuritySchemes = securitySchemes
		}
	}
	
	return &Spec{
		OpenAPI: "3.0.0",
		Info: Info{
			Title:       "API Documentation",
			Description: "Auto-generated API documentation",
			Version:     "1.0.0",
		},
		Servers:    []Server{{URL: baseURL}},
		Paths:      paths,
		Components: components,
	}
}

func sanitizeSchemaName(name string) string {
	result := ""
	for _, c := range name {
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') {
			result += string(c)
		}
	}
	return result
}
