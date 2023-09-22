package cmd

import (
	"context"
	"corvina/create-corvina-app/src/templates"
	"errors"
	"fmt"
	"html/template"
	"io"
	"io/fs"
	"os"
	"strings"

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

	if name == nil || name == "" {
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

func walkThroughWebAppTemplate(fn fs.WalkDirFunc) {
	err := fs.WalkDir(templates.CorvinaAppWeb, ".", fn)

	if err != nil {
		panic(err)
	}
}

func createWebApp(ctx context.Context) error {
	name := ctx.Value(Name).(string)

	// create folder called carvina-app-{name}
	destinationFolder := fmt.Sprintf("corvina-app-%s", name)
	os.Mkdir(destinationFolder, 0755)

	projectInfo := ProjectInfo{Name: name}

	walkThroughWebAppTemplate(func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if path == "." {
			return nil
		}

		if d.IsDir() {
			os.Mkdir(strings.Replace(path, "corvina-app-web", destinationFolder, 2), 0755)
			return nil
		}

		file, err := os.Create(strings.Replace(path, "corvina-app-web", destinationFolder, 1))
		if err != nil {
			return err
		}
		defer file.Close()

		fmt.Printf("path=%q, isDir=%v\n", path, d.IsDir())

		err = ParseFileAndExecuteTemplate(path, projectInfo, file)
		if err != nil {
			return err
		}

		return nil
	})
	return nil
}

type ProjectInfo struct {
	Name string
}

func ParseFileAndExecuteTemplate(name string, projectInfo ProjectInfo, writer io.Writer) error {
	tmpl, err := template.ParseFS(templates.CorvinaAppWeb, name)
	if err != nil {
		return err
	}

	err = tmpl.Execute(writer, projectInfo)
	if err != nil {
		return err
	}

	return nil
}
