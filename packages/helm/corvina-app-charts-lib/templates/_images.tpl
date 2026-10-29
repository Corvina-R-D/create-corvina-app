{{/*
Default images of the containers the library adds and of the RabbitMQ cluster, in a single place: a library release
bumps them in every app. Each one is overridable, by repository and tag, with .Values.images.<name>.
The images of the third-party charts (bitnami postgresql and redis, istio, stasher) keep the versions of their charts.
*/}}
{{- define "corvina-app-charts-lib.images" -}}
# runs as its own non-root USER (1100): an override must be a non-root image too
k8sWaitFor:
  repository: europe-docker.pkg.dev/corvina-exorint/dockerhub-remote/groundnuty/k8s-wait-for
  tag: no-root-v2.0
rabbitmq:
  repository: eu.gcr.io/corvina-exorint/rabbitmq
  tag: v2
registration:
  # automatic registration is expected only in dev environments, so :develop is acceptable
  repository: eu.gcr.io/corvina-exorint/corvina-devops-utils
  tag: develop
{{- end }}

{{/*
<repository>:<tag> of a default image, with .Values.images.<name>.repository and .tag overrides
Usage: {{ include "corvina-app-charts-lib.image" (dict "context" $ "name" "rabbitmq") }}
*/}}
{{- define "corvina-app-charts-lib.image" -}}
{{- $default := index (include "corvina-app-charts-lib.images" .context | fromYaml) .name }}
{{- $override := index (.context.Values.images | default dict) .name | default dict }}
{{- $override.repository | default $default.repository }}:{{ $override.tag | default $default.tag }}
{{- end }}

{{- define "corvina-app-charts-lib.image.k8sWaitFor" -}}
{{ include "corvina-app-charts-lib.image" (dict "context" . "name" "k8sWaitFor") }}
{{- end }}
