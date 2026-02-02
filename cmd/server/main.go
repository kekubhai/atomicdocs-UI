package main

import (
	"fmt"
	"log"
	
	"github.com/valyala/fasthttp"
	"github.com/yourusername/atomicdocs/internal/middleware"
	"github.com/yourusername/atomicdocs/internal/registry"
)

func main() {
	reg := registry.New()
	handler := middleware.NewHandler(reg)
	
	requestHandler := func(ctx *fasthttp.RequestCtx) {
		path := string(ctx.Path())
		method := string(ctx.Method())
		
		fmt.Printf("Request: %s %s\n", method, path)
		
		// Set JSON content type for all responses
		ctx.SetContentType("application/json")
		
		switch path {
		case "/api/register":
			handler.RegisterRoutes(ctx)
		case "/docs":
			handler.ServeUI(ctx)
		case "/docs/json":
			handler.GetSpec(ctx)
		default:
			ctx.SetStatusCode(fasthttp.StatusNotFound)
			ctx.SetBody([]byte(`{"error": "Not found"}`))
		}
	}
	
	fmt.Println("AtomicDocs server starting on :6174")
	
	if err := fasthttp.ListenAndServe(":6174", requestHandler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}