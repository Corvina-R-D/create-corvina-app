package cmd

import (
	"context"
	"errors"

	"github.com/manifoldco/promptui"
)

type CtxKey string

const Name CtxKey = "name"

func WebApp(ctx context.Context) error {
	ctx, err := takeNameFromCtxOrAskIt(ctx)
	if err != nil {
		return nil
	}

	return createWebApp(ctx)
}

func takeNameFromCtxOrAskIt(ctx context.Context) (context.Context, error) {
	name := ctx.Value(Name)

	if name == nil {
		result, err := askName()
		if err != nil {
			return ctx, err
		}

		return context.WithValue(ctx, Name, result), nil
	}

	return ctx, nil
}

func askName() (string, error) {
	validate := func(input string) error {
		if len(input) < 3 {
			return errors.New("assign a name with at list 3 characters")
		}
		return nil
	}

	prompt := promptui.Prompt{
		Label:    "Name",
		Validate: validate,
	}

	result, err := prompt.Run()
	if err != nil {
		return "", err
	}

	return result, nil
}

func createWebApp(ctx context.Context) error {
	return nil
}
