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

	var countK8s int
	var countRedis int
	var countRabbit int
	var countStasher int
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
				c.Context = context.WithValue(c.Context, cmd.Redis, getRedisValueFromCliContext(countRedis, c))
				c.Context = context.WithValue(c.Context, cmd.Kubernetes, getK8sValueFromCliContext(countK8s, c))
				c.Context = context.WithValue(c.Context, cmd.Rabbit, getRabbitValueFromCliContext(countRabbit, c))
				c.Context = context.WithValue(c.Context, cmd.Stasher, getStasherValueFromCliContext(countStasher, c))
				c.Context = context.WithValue(c.Context, cmd.ExperimentalSingleDockerfile, c.Bool("experimental-single-dockerfile"))
				c.Context = context.WithValue(c.Context, cmd.DestinationFolder, c.String("destinationFolder"))

				return cmd.WebApp(c.Context)
			},
			Flags: []cli.Flag{
				&cli.StringFlag{
					Name:    "name",
					Aliases: []string{"n"},
					Usage:   "Name of the application",
				},
				&cli.StringFlag{
					Name:    "destinationFolder",
					Aliases: []string{"o"},
					Usage:   "Destination folder",
				},
				&cli.BoolFlag{
					Name:    "kubernetes",
					Aliases: []string{"k8s"},
					Usage:   "Do you plan to deploy on kubernetes?",
					Count:   &countK8s,
				},
				&cli.BoolFlag{
					Name:    "redis",
					Aliases: []string{"r"},
					Usage:   "Do you plan to use Redis?",
					Count:   &countRedis,
				},
				&cli.BoolFlag{
					Name:  "rabbit",
					Usage: "Do you plan to use Rabbit?",
					Count: &countRabbit,
				},
				&cli.BoolFlag{
					Name:  "stasher",
					Usage: "Do you plan to use Corvina App Stasher?",
					Count: &countStasher,
				},
				&cli.BoolFlag{
					Name:  "experimental-single-dockerfile",
					Usage: "Use a single Dockerfile for both FE and BE. We also add some instructions to deploy the app on Heroku.",
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

func getRedisValueFromCliContext(count int, c *cli.Context) cmd.RedisValue {
	redisContextValue := cmd.RedisAsk
	if count == 1 && c.Bool("redis") {
		redisContextValue = cmd.RedisTrue
	} else if count == 1 && !c.Bool("redis") {
		redisContextValue = cmd.RedisFalse
	}
	return redisContextValue
}

func getRabbitValueFromCliContext(count int, c *cli.Context) cmd.RabbitValue {
	rabbitContextValue := cmd.RabbitAsk
	if count == 1 && c.Bool("rabbit") {
		rabbitContextValue = cmd.RabbitTrue
	} else if count == 1 && !c.Bool("rabbit") {
		rabbitContextValue = cmd.RabbitFalse
	}
	return rabbitContextValue
}

func getStasherValueFromCliContext(count int, c *cli.Context) cmd.StasherValue {
	stasherContextValue := cmd.StasherAsk
	if count == 1 && c.Bool("stasher") {
		stasherContextValue = cmd.StasherTrue
	} else if count == 1 && !c.Bool("stasher") {
		stasherContextValue = cmd.StasherFalse
	}
	return stasherContextValue
}
