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

var verboseFlag *cli.BoolFlag = &cli.BoolFlag{
	Name:    "verbose",
	Aliases: []string{"v"},
	Usage:   "Enable verbose mode",
}

func main() {
	utils.InitLog()

	app := &cli.App{
		Name:  "create-corvina-app",
		Usage: "make an explosive entrance",
		Action: func(*cli.Context) error {
			fmt.Println(`List of available commands:
	- version: Print the current cli version
	- webapp: Create a web application that can be installed in corvina app store`)
			return nil
		},
		Flags: []cli.Flag{
			verboseFlag,
		},
	}

	var count int
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
				if c.Bool("verbose") {
					utils.VerboseLog()
				}

				c.Context = context.WithValue(c.Context, cmd.Name, c.String("name"))
				c.Context = context.WithValue(c.Context, cmd.Kubernetes, getK8sValueFromCliContext(count, c))

				cmd.WebApp(c.Context)
				return nil
			},
			Flags: []cli.Flag{
				&cli.StringFlag{
					Name:    "name",
					Aliases: []string{"n"},
					Usage:   "Name of the application",
				},
				&cli.BoolFlag{
					Name:    "kubernetes",
					Aliases: []string{"k8s"},
					Usage:   "Do you plan to deploy on kubernetes?",
					Count:   &count,
				},
				verboseFlag,
			},
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal().Err(err).Msg("Error running the app")
	}
}

func getK8sValueFromCliContext(count int, c *cli.Context) cmd.KubernetesValue {
	k8sContextValue := cmd.KubernetesAsk
	if count == 1 && c.Bool("kubernetes") {
		k8sContextValue = cmd.KubernetesTrue
	} else if count == 1 && !c.Bool("kubernetes") {
		k8sContextValue = cmd.KubernetesFalse
	}
	return k8sContextValue
}
