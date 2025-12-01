package types

type RouteInfo struct {
	Method      string              `json:"method"`
	Path        string              `json:"path"`
	Handler     string              `json:"handler"`
	FilePath    string              `json:"filePath,omitempty"`
	Imports     []Import            `json:"imports,omitempty"`
	Summary     string              `json:"summary,omitempty"`
	Description string              `json:"description,omitempty"`
	Tags        []string            `json:"tags,omitempty"`
	Parameters  []Parameter         `json:"parameters,omitempty"`
	RequestBody *RequestBody        `json:"requestBody,omitempty"`
	Responses   map[string]Response `json:"responses,omitempty"`
	Security    []SecurityRequirement `json:"security,omitempty"`
}

type Import struct {
	Name string `json:"name"`
	From string `json:"from"`
}

type Parameter struct {
	Name        string `json:"name"`
	In          string `json:"in"` // path, query, header, cookie
	Required    bool   `json:"required,omitempty"`
	Schema      Schema `json:"schema"`
	Description string `json:"description,omitempty"`
	Example     interface{} `json:"example,omitempty"`
}

type RequestBody struct {
	Required    bool                       `json:"required,omitempty"`
	Description string                     `json:"description,omitempty"`
	Content     map[string]MediaTypeObject `json:"content"`
}

type MediaTypeObject struct {
	Schema  Schema      `json:"schema"`
	Example interface{} `json:"example,omitempty"`
}

type Response struct {
	Description string                     `json:"description"`
	Content     map[string]MediaTypeObject `json:"content,omitempty"`
	Headers     map[string]HeaderObject    `json:"headers,omitempty"`
}

type HeaderObject struct {
	Description string `json:"description,omitempty"`
	Schema      Schema `json:"schema"`
}

type Schema struct {
	Type       string            `json:"type,omitempty"`
	Format     string            `json:"format,omitempty"`
	Properties map[string]Schema `json:"properties,omitempty"`
	Items      *Schema           `json:"items,omitempty"`
	Example    interface{}       `json:"example,omitempty"`
	Required   []string          `json:"required,omitempty"`
	Enum       []string          `json:"enum,omitempty"`
	Ref        string            `json:"$ref,omitempty"`
}

type SecurityRequirement map[string][]string

type SecurityScheme struct {
	Type         string `json:"type"` // apiKey, http, oauth2, openIdConnect
	Description  string `json:"description,omitempty"`
	Name         string `json:"name,omitempty"`         // for apiKey
	In           string `json:"in,omitempty"`           // header, query, cookie (for apiKey)
	Scheme       string `json:"scheme,omitempty"`       // bearer, basic (for http)
	BearerFormat string `json:"bearerFormat,omitempty"` // JWT (for http bearer)
}
