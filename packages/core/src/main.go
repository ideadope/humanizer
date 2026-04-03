package main

import (
	"regexp"
	"strings"
	"syscall/js"
)

// humanizeText handles the string manipulation logic
func humanizeText(this js.Value, args []js.Value) any {
	if len(args) < 1 {
		return ""
	}
	input := args[0].String()

	// 1. Technical Sanitization: Strip invisible Unicode markers
	re := regexp.MustCompile(`[\x{200B}-\x{200D}\x{FEFF}\x{2060}\x{180E}]`)
	sanitized := re.ReplaceAllString(input, "")

	// 2. Structural Jitter: Basic sentence splitting logic
	sentences := strings.Split(sanitized, ". ")
	var builder strings.Builder

	for i, s := range sentences {
		builder.WriteString(strings.TrimSpace(s))
		// Break the AI's uniform rhythm every 3 sentences
		if i%3 == 0 && i != len(sentences)-1 && len(sentences) > 1 {
			builder.WriteString("... ") 
		} else if i != len(sentences)-1 {
			builder.WriteString(". ")
		}
	}
	return builder.String()
}

func main() {
	// Register the function to the global JS scope
	js.Global().Set("humanizeText", js.FuncOf(humanizeText))

	// Prevent the Go program from exiting immediately
	select {}
}