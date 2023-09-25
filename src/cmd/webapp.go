package cmd

import (
	"context"
	"corvina/create-corvina-app/src/templates"
	"corvina/create-corvina-app/src/utils"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path"
	"strings"
	"text/template"

	"github.com/manifoldco/promptui"
	"github.com/rs/zerolog/log"
)

type CtxKey string

const Name CtxKey = "name"
const DestinationFolder CtxKey = "destinationFolder"

func WebApp(ctx context.Context) error {
	ctx, err := takeNameFromCtxOrAskIt(ctx)
	if err != nil {
		return nil
	}

	ctx = context.WithValue(ctx, DestinationFolder, fmt.Sprintf("corvina-app-%s", ctx.Value(Name)))

	stopIfDestinationFolderIsNotEmpty(ctx)

	err = createWebApp(ctx)
	if err != nil {
		return err
	}

	utils.PrintlnGreen("Corvina web app created successfully!")
	utils.PrintlnCyan(fmt.Sprintf("- cd %s", ctx.Value(DestinationFolder)))
	utils.PrintlnCyan("- follow the instructions in the README.md file to run the app")

	return nil
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
	destinationFolder := ctx.Value(DestinationFolder).(string)

	os.Mkdir(destinationFolder, 0755)

	projectInfo := ProjectInfo{Name: name}

	walkThroughWebAppTemplate(func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if path == "." {
			return nil
		}

		log.Info().Str("path", path).Msg("Processing file")

		if d.IsDir() {
			dirName := strings.Replace(path, "corvina-app-web", destinationFolder, 2)
			log.Info().Str("path", dirName).Msg("Creating folder")

			if _, err := os.Stat(dirName); os.IsNotExist(err) {
				return os.Mkdir(dirName, 0755)
			}

			return nil
		}

		file, err := os.Create(strings.Replace(path, "corvina-app-web", destinationFolder, 2))
		if err != nil {
			return err
		}
		defer file.Close()

		if isFileToCopyAsIs(path) {
			log.Info().Str("path", path).Msg("Copying file as is")
			err = CopyAsIs(path, file)
			if err != nil {
				return err
			}
			return nil
		}

		log.Info().Str("path", path).Msg("Parsing file and executing template")
		err = ParseFileAndExecuteTemplate(path, projectInfo, file)
		if err != nil {
			return err
		}

		return nil
	})
	return nil
}

var (
	extensionsToCopyAsIs = []string{".vue", ".eot", ".ttf", ".woff", ".woff2", ".tgz", ".jpeg"}
)

func isFileToCopyAsIs(path string) bool {
	for _, extension := range extensionsToCopyAsIs {
		if strings.HasSuffix(path, extension) {
			return true
		}
	}
	return false
}

func CopyAsIs(path string, writer *os.File) error {
	originalFile, err := templates.CorvinaAppWeb.Open(path)
	if err != nil {
		return err
	}
	_, err = io.Copy(writer, originalFile)
	if err != nil {
		return err
	}
	return nil
}

type ProjectInfo struct {
	Name string
}

func ParseFileAndExecuteTemplate(name string, projectInfo ProjectInfo, writer io.Writer) error {

	tmpl, err := template.
		New(path.Base(name)).
		Delims("[|", "|]"). // change the default delimiters to avoid conflicts with vue and helm
		ParseFS(templates.CorvinaAppWeb, name)

	if err != nil {
		return err
	}

	err = tmpl.Execute(writer, projectInfo)
	if err != nil {
		return err
	}

	return nil
}

func stopIfDestinationFolderIsNotEmpty(ctx context.Context) {
	if !destinationFolderIsEmptyOrNotPresent(ctx) {
		utils.PrintlnYellow(fmt.Sprintf("The folder %s is not empty, please delete it or choose another name", ctx.Value(DestinationFolder).(string)))
		os.Exit(0)
	}
}

func destinationFolderIsEmptyOrNotPresent(ctx context.Context) bool {
	destinationFolder := ctx.Value(DestinationFolder).(string)

	if _, err := os.Stat(destinationFolder); os.IsNotExist(err) {
		return true
	}

	files, err := os.ReadDir(destinationFolder)
	if err != nil {
		log.Fatal().Err(err).Msg("Error reading the destination folder")
	}

	return len(files) == 0
}
