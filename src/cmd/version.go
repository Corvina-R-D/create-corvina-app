package cmd

import "fmt"

// value set by ldflags
var CliVersion string

func Version() {
	fmt.Println(CliVersion)
}
