package main

import (
	"corvina/create-corvina-app/src/cmd"
	"corvina/create-corvina-app/src/utils"
	"fmt"
	"os"

	"github.com/rs/zerolog/log"
	cli "github.com/urfave/cli/v2"
)

func main() {
	utils.InitLog()

	app := &cli.App{
		Name:  "create-corvina-app",
		Usage: "make an explosive entrance",
		Action: func(*cli.Context) error {
			fmt.Println(`List of available commands:
	- version
	- webapp`)
			return nil
		},
	}

	app.Commands = []*cli.Command{
		{
			Name:  "version",
			Usage: "Print the version",
			Action: func(c *cli.Context) error {
				cmd.Version()
				return nil
			},
		},
		{
			Name:  "webapp",
			Usage: "Create a web application that can be installed in corvina app store",
			Action: func(c *cli.Context) error {
				cmd.WebApp(c.Context)
				return nil
			},
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal().Err(err).Msg("Error running the app")
	}
}
