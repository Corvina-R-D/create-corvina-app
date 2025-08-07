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
	"os/exec"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"text/template"

	"github.com/manifoldco/promptui"
	"github.com/rs/zerolog/log"
)

type CtxKey string

const Name CtxKey = "name"
const Redis CtxKey = "redis"
const RedisBool CtxKey = "redisBool"
const Rabbit CtxKey = "rabbit"
const RabbitBool CtxKey = "rabbitBool"
const Stasher CtxKey = "stasher"
const StasherBool CtxKey = "stasherBool"
const Kubernetes CtxKey = "kubernetes"
const KubernetesBool CtxKey = "kubernetesBool"
const ExperimentalSingleDockerfile CtxKey = "experimentalSingleDockerfile"
const DisableNameValidation CtxKey = "disableNameValidation"
const SkipPackageLockGeneration CtxKey = "skipPackageLockGeneration"
const DestinationFolder CtxKey = "destinationFolder"

type RedisValue string

const (
	RedisTrue  RedisValue = "true"
	RedisFalse RedisValue = "false"
	RedisAsk   RedisValue = "ask"
)

type RabbitValue string

const (
	RabbitTrue  RabbitValue = "true"
	RabbitFalse RabbitValue = "false"
	RabbitAsk   RabbitValue = "ask"
)

type StasherValue string

const (
	StasherTrue  StasherValue = "true"
	StasherFalse StasherValue = "false"
	StasherAsk   StasherValue = "ask"
)

type KubernetesValue string

const (
	KubernetesTrue  KubernetesValue = "true"
	KubernetesFalse KubernetesValue = "false"
	KubernetesAsk   KubernetesValue = "ask"
)

func WebApp(ctx context.Context) error {
	ctx, err := takeNameFromCtxOrAskIt(ctx)
	if err != nil {
		return err
	}

	ctx, err = takeRedisFromCtxOrAskIt(ctx)
	if err != nil {
		return err
	}

	ctx, err = takeRabbitFromCtxOrAskIt(ctx)
	if err != nil {
		return err
	}

	ctx, err = takeStasherFromCtxOrAskIt(ctx)
	if err != nil {
		return err
	}

	ctx, err = takeKubernetesFromCtxOrAskIt(ctx)
	if err != nil {
		return err
	}

	ctx, err = takeDestinationFolderFromCtxOrDefault(ctx)
	if err != nil {
		return err
	}

	stopIfDestinationFolderIsNotEmpty(ctx)

	err = createWebApp(ctx)
	if err != nil {
		return err
	}

	skipPackageLockGeneration := ctx.Value(SkipPackageLockGeneration).(bool)

	if !skipPackageLockGeneration {
		err = runNpmInstallForEachPackageJson(ctx)
		if err != nil {
			return err
		}
	}

	utils.PrintlnGreen("Corvina web app created successfully!")
	utils.PrintlnCyan(fmt.Sprintf("- cd %s", ctx.Value(DestinationFolder)))
	utils.PrintlnCyan("- follow the instructions in the README.md file to run the app")

	return nil
}

func takeNameFromCtxOrAskIt(ctx context.Context) (context.Context, error) {
	name := ctx.Value(Name)
	disableValidation := ctx.Value(DisableNameValidation)

	if name == nil || name == "" {
		result, err := askName()
		if err != nil {
			return ctx, err
		}

		return context.WithValue(ctx, Name, result), nil
	}

	if disableValidation == nil || !disableValidation.(bool) {
		err := validateName(name.(string))
		if err != nil {
			return ctx, err
		}
	}

	return ctx, nil
}

func validateName(name string) error {
	// at least 3 characters
	if len(name) < 3 {
		return errors.New("assign a name with at least 3 characters")
	}

	// only letters and numbers (but not in the first position)
	mateched, err := regexp.MatchString("^[a-z][a-z0-9\\-]{0,15}$", name)
	if err != nil {
		return err
	}

	if !mateched {
		return errors.New("assign a name only letters and numbers or - are allowed, but not in the first position, and with a maximum of 15 characters")
	}

	return nil
}

func askName() (string, error) {
	prompt := promptui.Prompt{
		Label:    "Name",
		Validate: validateName,
	}

	result, err := prompt.Run()
	if err != nil {
		return "", err
	}

	return result, nil
}

func takeRedisFromCtxOrAskIt(ctx context.Context) (context.Context, error) {
	redis := ctx.Value(Redis).(RedisValue)

	switch redis {
	case RedisTrue:
		return context.WithValue(ctx, RedisBool, true), nil
	case RedisFalse:
		return context.WithValue(ctx, RedisBool, false), nil
	default:
		result, err := askRedis()
		if err != nil {
			return ctx, err
		}

		return context.WithValue(ctx, RedisBool, result), nil
	}
}

func takeRabbitFromCtxOrAskIt(ctx context.Context) (context.Context, error) {
	rabbit := ctx.Value(Rabbit).(RabbitValue)

	switch rabbit {
	case RabbitTrue:
		return context.WithValue(ctx, RabbitBool, true), nil
	case RabbitFalse:
		return context.WithValue(ctx, RabbitBool, false), nil
	default:
		result, err := askRabbit()
		if err != nil {
			return ctx, err
		}
		return context.WithValue(ctx, RabbitBool, result), nil
	}
}

func takeStasherFromCtxOrAskIt(ctx context.Context) (context.Context, error) {
	stasher := ctx.Value(Stasher).(StasherValue)

	switch stasher {
	case StasherTrue:
		return context.WithValue(ctx, StasherBool, true), nil
	case StasherFalse:
		return context.WithValue(ctx, StasherBool, false), nil
	default:
		result, err := askStasher()
		if err != nil {
			return ctx, err
		}
		return context.WithValue(ctx, StasherBool, result), nil
	}
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

func takeDestinationFolderFromCtxOrDefault(ctx context.Context) (context.Context, error) {
	destinationFolder := ctx.Value(DestinationFolder)

	if destinationFolder == nil || destinationFolder == "" {
		return context.WithValue(ctx, DestinationFolder, fmt.Sprintf("corvina-app-%s", ctx.Value(Name))), nil
	}

	return ctx, nil
}

func askRedis() (bool, error) {
	prompt := promptui.Select{
		Label: "Do you plan to use redis?",
		Items: []string{"Yes", "No"},
	}

	_, result, err := prompt.Run()
	if err != nil {
		return false, err
	}

	return result == "Yes", nil
}

func askRabbit() (bool, error) {
	prompt := promptui.Select{
		Label: "Do you plan to use rabbit?",
		Items: []string{"Yes", "No"},
	}

	_, result, err := prompt.Run()
	if err != nil {
		return false, err
	}

	return result == "Yes", nil
}

func askStasher() (bool, error) {
	prompt := promptui.Select{
		Label: "Do you plan to use stasher to reliable sync with corvina platform through REST APIs?",
		Items: []string{"Yes", "No"},
	}

	_, result, err := prompt.Run()
	if err != nil {
		return false, err
	}
	return result == "Yes", nil
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
	destinationFolder := ctx.Value(DestinationFolder).(string)
	rabbit := ctx.Value(RabbitBool).(bool)
	stasher := ctx.Value(StasherBool).(bool)
	redis := ctx.Value(RedisBool).(bool) || stasher
	k8s := ctx.Value(KubernetesBool).(bool)
	singleDockerfile := ctx.Value(ExperimentalSingleDockerfile).(bool)
	options := ""
	if redis {
		options += "--redis "
	} else {
		options += "--redis=false "
	}
	if k8s {
		options += "--kubernetes "
	} else {
		options += "--kubernetes=false "
	}
	if stasher {
		options += "--stasher "
	} else {
		options += "--stasher=false "
	}
	if rabbit {
		options += "--rabbit "
	} else {
		options += "--rabbit=false "
	}

	os.Mkdir(destinationFolder, 0755)

	projectInfo := ProjectInfo{
		Name:                            name,
		RedisEnabled:                    redis,
		StasherEnabled:                  stasher,
		RabbitEnabled:                   rabbit,
		SingleDockerfile:                singleDockerfile,
		K8sEnabled:                      k8s,
		CreateCorvinaAppCreationOptions: options,
		CreateCorvinaAppVersion:         CliVersion,
	}

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

		if skipThisFile(path, projectInfo) {
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

		// if file is a shell script, make it executable
		if strings.HasSuffix(path, ".sh") {
			err = os.Chmod(file.Name(), 0755)
			if err != nil {
				return err
			}
		}

		return nil
	})
	return nil
}

func runCommand(command string, dir string) error {
	cmd := exec.Command("sh", "-c", command)
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func runNpmInstallForEachPackageJson(ctx context.Context) (err error) {
	log.Debug().Msg("Running npm install for each package.json")
	destinationFolder := ctx.Value(DestinationFolder).(string)
	log.Debug().Msg("Destination folder " + destinationFolder)
	err = fs.WalkDir(os.DirFS(destinationFolder), ".", func(path string, d fs.DirEntry, err error) error {
		log.Debug().Msg("Check " + path)
		if err != nil {
			return err
		}

		if d.IsDir() {
			return nil
		}

		if filepath.Base(path) == "package.json" {
			log.Info().Str("path", filepath.Dir(path)).Msg("Running npm install")
			err = runCommand("npm install --package-lock-only", filepath.Join(destinationFolder, filepath.Dir(path)))
			if err != nil {
				log.Error().Err(err).Msg("Error running npm install")
			}
		}

		return nil
	})

	if err != nil {
		log.Error().Err(err).Msg("Error running npm install")
	}

	return
}

func skipThisFolder(path string, k8s bool) bool {
	if k8s {
		return false
	}

	return strings.Contains(path, "helm-charts")
}

var filesToExcludeK8s = []string{
	"corvina-app-web/build.sh",
	"corvina-app-web/deploy.internal-qa.sh",
	"corvina-app-web/deploy.internal.sh",
	"corvina-app-web/draft-new-release.sh",
	"corvina-app-web/install-certificate-locally.sh",
	".minikube.sh",
}

var filesToExcludeRedis = []string{
	"pf-redis.minikube.sh",
	"corvina-app-web/templates/PrometheusRule-redis.yaml",
}

var filesToExcludeRabbit = []string{
	"corvina-app-web/templates/rabbit-cluster.yaml",
	"corvina-app-web/templates/PrometheusRule-rabbitmq.yaml",
	"corvina-app-web/templates/ServiceMonitor-rabbitmq.yaml",
}

var filesToExcludeStasher = []string{
	"corvina-app-web/templates/stasher.yaml",
}

var filesToExclude = map[string][]string{
	"k8s":     filesToExcludeK8s,
	"redis":   filesToExcludeRedis,
	"rabbit":  filesToExcludeRabbit,
	"stasher": filesToExcludeStasher,
}

func skipThisFile(path string, projectInfo ProjectInfo) bool {

	if !projectInfo.RedisEnabled {
		for _, file := range filesToExclude["redis"] {
			if strings.Contains(path, file) {
				return true
			}
		}
	}

	if !projectInfo.K8sEnabled {
		for _, file := range filesToExclude["k8s"] {
			if strings.Contains(path, file) {
				return true
			}
		}
	}

	if !projectInfo.RabbitEnabled {
		for _, file := range filesToExclude["rabbit"] {
			if strings.Contains(path, file) {
				return true
			}
		}
	}

	if !projectInfo.StasherEnabled {
		for _, file := range filesToExclude["stasher"] {
			if strings.Contains(path, file) {
				return true
			}
		}
	}

	if !projectInfo.SingleDockerfile {
		if path == "corvina-app-web/Dockerfile" {
			return true
		}
	}

	return false
}

var (
	extensionsToCopyAsIs = []string{".eot", ".ttf", ".woff", ".woff2", ".tgz", ".jpeg"}
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
	Name                            string
	RedisEnabled                    bool
	StasherEnabled                  bool
	RabbitEnabled                   bool
	K8sEnabled                      bool
	SingleDockerfile                bool
	CreateCorvinaAppCreationOptions string
	CreateCorvinaAppVersion         string
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
