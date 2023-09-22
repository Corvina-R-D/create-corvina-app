package main

import (
	"context"
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
				c.Context = context.WithValue(c.Context, cmd.Name, c.String("name"))

				cmd.WebApp(c.Context)
				return nil
			},
			Flags: []cli.Flag{
				&cli.StringFlag{
					Name:    "name",
					Aliases: []string{"n"},
					Usage:   "Name of the application",
				},
			},
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal().Err(err).Msg("Error running the app")
	}
}
