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
const Kubernetes CtxKey = "kubernetes"
const KubernetesBool CtxKey = "kubernetesBool"
const destinationFolder CtxKey = "destinationFolder"

type KubernetesValue string

const (
	KubernetesTrue  KubernetesValue = "true"
	KubernetesFalse KubernetesValue = "false"
	KubernetesAsk   KubernetesValue = "ask"
)

func WebApp(ctx context.Context) error {
	ctx, err := takeNameFromCtxOrAskIt(ctx)
	if err != nil {
		return nil
	}

	ctx, err = takeKubernetesFromCtxOrAskIt(ctx)
	if err != nil {
		return nil
	}

	ctx = context.WithValue(ctx, destinationFolder, fmt.Sprintf("corvina-app-%s", ctx.Value(Name)))

	stopIfDestinationFolderIsNotEmpty(ctx)

	err = createWebApp(ctx)
	if err != nil {
		return err
	}

	utils.PrintlnGreen("Corvina web app created successfully!")
	utils.PrintlnCyan(fmt.Sprintf("- cd %s", ctx.Value(destinationFolder)))
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

func takeKubernetesFromCtxOrAskIt(ctx context.Context) (context.Context, error) {
	k8s := ctx.Value(Kubernetes).(KubernetesValue)

	switch k8s {
	case KubernetesTrue:
		return context.WithValue(ctx, KubernetesBool, true), nil
	case KubernetesFalse:
		return context.WithValue(ctx, KubernetesBool, false), nil
	default:
		result, err := askKubernetes()
		if err != nil {
			return ctx, err
		}

		return context.WithValue(ctx, KubernetesBool, result), nil
	}
}

func askKubernetes() (bool, error) {
	prompt := promptui.Select{
		Label: "Do you plan to deploy on kubernetes? We will add a helm chart for you",
		Items: []string{"Yes", "No"},
	}

	_, result, err := prompt.Run()
	if err != nil {
		return false, err
	}

	return result == "Yes", nil
}

func walkThroughWebAppTemplate(fn fs.WalkDirFunc) {
	err := fs.WalkDir(templates.CorvinaAppWeb, ".", fn)

	if err != nil {
		panic(err)
	}
}

func createWebApp(ctx context.Context) error {
	name := ctx.Value(Name).(string)
	destinationFolder := ctx.Value(destinationFolder).(string)
	k8s := ctx.Value(KubernetesBool).(bool)

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
			if skipThisFolder(path, k8s) {
				return fs.SkipDir
			}

			dirName := strings.Replace(path, "corvina-app-web", destinationFolder, 2)
			log.Info().Str("path", dirName).Msg("Creating folder")

			if _, err := os.Stat(dirName); os.IsNotExist(err) {
				return os.Mkdir(dirName, 0755)
			}

			return nil
		}

		if skipThisFile(path, k8s) {
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

func skipThisFolder(path string, k8s bool) bool {
	if k8s {
		return false
	}

	return strings.Contains(path, "helm-charts")
}

var filesToExclude = []string{
	"corvina-app-web/build.sh",
	"corvina-app-web/deploy.internal-qa.sh",
	"corvina-app-web/deploy.internal.sh",
	"corvina-app-web/draft-new-release.sh",
	"corvina-app-web/install-certificate-locally.sh",
}

func skipThisFile(path string, k8s bool) bool {
	if k8s {
		return false
	}

	for _, file := range filesToExclude {
		if strings.Contains(path, file) {
			return true
		}
	}

	return strings.Contains(path, ".minikube.sh")
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
		utils.PrintlnYellow(fmt.Sprintf("The folder %s is not empty, please delete it or choose another name", ctx.Value(destinationFolder).(string)))
		os.Exit(0)
	}
}

func destinationFolderIsEmptyOrNotPresent(ctx context.Context) bool {
	destinationFolder := ctx.Value(destinationFolder).(string)

	if _, err := os.Stat(destinationFolder); os.IsNotExist(err) {
		return true
	}

	files, err := os.ReadDir(destinationFolder)
	if err != nil {
		log.Fatal().Err(err).Msg("Error reading the destination folder")
	}

	return len(files) == 0
}
