{{/*
Short app name, e.g. "ota" for the chart "corvina-app-ota". Override with .Values.appName
*/}}
{{- define "corvina-app-charts-lib.appName" -}}
{{- .Values.appName | default (trimPrefix "corvina-app-" .Chart.Name) }}
{{- end }}
{{/*
Expand the name of the chart.
*/}}
{{- define "corvina-app-charts-lib.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}
{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "corvina-app-charts-lib.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}
{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "corvina-app-charts-lib.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}
{{/*
Common labels
*/}}
{{- define "corvina-app-charts-lib.labels" -}}
helm.sh/chart: {{ include "corvina-app-charts-lib.chart" . }}
{{ include "corvina-app-charts-lib.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}
{{/*
Selector labels
*/}}
{{- define "corvina-app-charts-lib.selectorLabels" -}}
app.kubernetes.io/name: {{ include "corvina-app-charts-lib.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
{{/*
Optional components are enabled by the presence of their values (redis and rabbitmq come from base.yaml.gotmpl
only when the app was generated with them); `enabled: false` turns them off explicitly.
Usage: {{ if include "corvina-app-charts-lib.redisEnabled" . }}
*/}}
{{- define "corvina-app-charts-lib.redisEnabled" -}}
{{- if and .Values.redis (ne (toString (dig "enabled" true .Values.redis)) "false") }}true{{ end }}
{{- end }}
{{- define "corvina-app-charts-lib.rabbitmqEnabled" -}}
{{- if and .Values.rabbitmq (ne (toString (dig "enabled" true .Values.rabbitmq)) "false") }}true{{ end }}
{{- end }}
{{/*
Backend Kubernetes Service name (.Values.service.serviceName)
*/}}
{{- define "corvina-app-charts-lib.serviceName" -}}
{{- .Values.service.serviceName | default "service-service" }}
{{- end }}
{{/*
Postgresql service the backend connects to and the migrator waits for (.Values.service.postgresHost, tpl allowed)
*/}}
{{- define "corvina-app-charts-lib.postgresHost" -}}
{{- tpl (.Values.service.postgresHost | default "{{ .Release.Name }}-postgresql") . }}
{{- end }}
{{/*
Env var holding the postgresql password (.Values.service.postgresPasswordEnv)
*/}}
{{- define "corvina-app-charts-lib.postgresPasswordEnv" -}}
{{- .Values.service.postgresPasswordEnv | default "PG_PASS" }}
{{- end }}
{{/*
Security context of the containers of the app images
*/}}
{{- define "corvina-app-charts-lib.containerSecurityContext" -}}
runAsNonRoot: true
allowPrivilegeEscalation: false
capabilities:
  drop:
    - ALL
seccompProfile:
  type: RuntimeDefault
{{- end }}
{{/*
Security context of third-party containers without a USER: run them as nobody
*/}}
{{- define "corvina-app-charts-lib.nobodySecurityContext" -}}
runAsUser: 65534
{{ include "corvina-app-charts-lib.containerSecurityContext" . }}
{{- end }}
{{/*
ServiceAccount with the optional GKE workload identity link from .Values.workloadIdentity.gcpSaLinks
Usage: {{ include "corvina-app-charts-lib.serviceAccount" (dict "name" "app-sa" "context" $) }}
*/}}
{{- define "corvina-app-charts-lib.serviceAccount" -}}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ .name }}
  namespace: {{ .context.Release.Namespace }}
  annotations:
    {{- with (dig "gcpSaLinks" .name "" (.context.Values.workloadIdentity | default dict)) }}
    iam.gke.io/gcp-service-account: "{{ . }}"
    {{- end }}
{{- end }}
{{/*
The pods don't mount the ServiceAccount token (automountServiceAccountToken: false): only the containers that call
the Kubernetes API (k8s-wait-for) mount it, with this volume replicating the one the kubelet would add
*/}}
{{- define "corvina-app-charts-lib.kubeApiAccessVolume" -}}
- name: kube-api-access
  projected:
    sources:
      - serviceAccountToken:
          path: token
          expirationSeconds: 3607
      - configMap:
          name: kube-root-ca.crt
          items:
            - key: ca.crt
              path: ca.crt
      - downwardAPI:
          items:
            - path: namespace
              fieldRef:
                fieldPath: metadata.namespace
{{- end }}
{{- define "corvina-app-charts-lib.kubeApiAccessVolumeMount" -}}
- name: kube-api-access
  mountPath: /var/run/secrets/kubernetes.io/serviceaccount
  readOnly: true
{{- end }}
