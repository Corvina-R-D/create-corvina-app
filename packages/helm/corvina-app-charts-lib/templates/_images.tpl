{{/*
Registry of the Docker Hub images (.Values.global.imageRegistry)
*/}}
{{- define "corvina-app-charts-lib.dockerhubRegistry" -}}
{{- .Values.global.imageRegistry | required "global.imageRegistry is required" }}
{{- end }}

{{/*
A Docker Hub image from global.imageRegistry
Usage: {{ include "corvina-app-charts-lib.dockerhubImage" (dict "context" $ "image" "bitnami/kubectl:1.31") }}
*/}}
{{- define "corvina-app-charts-lib.dockerhubImage" -}}
{{ include "corvina-app-charts-lib.dockerhubRegistry" .context }}/{{ .image }}
{{- end }}

{{/*
<registry>/<repository>:<tag> of .Values.images.<name>; without a registry, from global.imageRegistry
Usage: {{ include "corvina-app-charts-lib.image" (dict "context" $ "name" "rabbitmq") }}
*/}}
{{- define "corvina-app-charts-lib.image" -}}
{{- include "corvina-app-charts-lib.requireDefaults" .context }}
{{- $image := index .context.Values.images .name | required (printf "images.%s is required" .name) }}
{{- $image.registry | default (include "corvina-app-charts-lib.dockerhubRegistry" .context) }}/{{ $image.repository }}:{{ $image.tag }}
{{- end }}

{{- define "corvina-app-charts-lib.image.k8sWaitFor" -}}
{{ include "corvina-app-charts-lib.image" (dict "context" . "name" "k8sWaitFor") }}
{{- end }}
