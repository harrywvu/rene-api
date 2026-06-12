package main

import (
	"reflect"
	"testing"
)

func TestParseAllowedOrigins(t *testing.T) {
	t.Run("defaults when empty", func(t *testing.T) {
		got := parseAllowedOrigins("")
		want := []string{"http://localhost:5173", "http://127.0.0.1:5173", "https://*.vercel.app"}
		if !reflect.DeepEqual(got, want) {
			t.Fatalf("parseAllowedOrigins(\"\") = %#v, want %#v", got, want)
		}
	})

	t.Run("splits and trims", func(t *testing.T) {
		got := parseAllowedOrigins(" https://app.example.com , https://*.vercel.app ,")
		want := []string{"http://localhost:5173", "http://127.0.0.1:5173", "https://*.vercel.app", "https://app.example.com"}
		if !reflect.DeepEqual(got, want) {
			t.Fatalf("parseAllowedOrigins(...) = %#v, want %#v", got, want)
		}
	})
}
