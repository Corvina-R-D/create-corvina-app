{{- define "corvina-app-lib.externalSecretsGenerator" -}}
apiVersion: generators.external-secrets.io/v1alpha1
kind: {{ ternary "Password" "Fake" (empty .Values.fakeExternalSecrets) }}
name: password-generator
{{- end }}

{{/*
Generated password ExternalSecret, immutable once created
Usage: {{ include "corvina-app-lib.generatedSecret" (dict "name" "my-secret" "data" (dict "key" "{{ .password }}") "context" $) }}
*/}}
{{- define "corvina-app-lib.generatedSecret" -}}
{{- $ := .context -}}
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: {{ .name }}
  namespace: {{ $.Release.Namespace }}
  labels:
    {{ include "corvina-app-lib.selectorLabels" $ | nindent 4 }}
    app.kubernetes.io/managed-by: {{ $.Release.Service }}
spec:
  dataFrom:
  - sourceRef:
      generatorRef:
        {{ include "corvina-app-lib.externalSecretsGenerator" $ | nindent 8 }}
  refreshInterval: "0"
  target:
    creationPolicy: Owner
    deletionPolicy: Delete
    immutable: true
    template:
      metadata:
        annotations:
          # argocd only skips app refreshes for untracked objects carrying this annotation,
          # and external-secrets rewrites its data-hash annotation constantly on immutable targets
          argocd.argoproj.io/ignore-resource-updates: "true"
      engineVersion: v2
      mergePolicy: Replace
      data:
        {{- range $key, $value := .data }}
        {{ $key }}: {{ $value | quote }}
        {{- end }}
{{- end }}

{{/*
Password generator (Fake with .Values.fakeExternalSecrets, for minikube) and the generated postgresql and redis
passwords
Values: fakeExternalSecrets, postgresql.global.postgresql.auth.existingSecret, redis.auth.existingSecret
*/}}
{{- define "corvina-app-lib.secrets" -}}
{{- if not .Values.fakeExternalSecrets }}
apiVersion: generators.external-secrets.io/v1alpha1
kind: Password
metadata:
  name: password-generator
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "corvina-app-lib.labels" . | nindent 4 }}
spec:
  allowRepeat: true
  length: 32
  noUpper: false
  symbols: 0
{{- else }}
apiVersion: generators.external-secrets.io/v1alpha1
kind: Fake
metadata:
  name: password-generator
  namespace: {{ .Release.Namespace }}
spec:
  data:
    {{ toYaml .Values.fakeExternalSecrets | nindent 4 }}
{{- end }}
{{- with .Values.postgresql.global.postgresql.auth.existingSecret }}
---
{{ include "corvina-app-lib.generatedSecret" (dict "name" . "data" (dict "postgres-password" "{{ trunc 16 .password  }}" "password" "{{ trunc -16 .password }}") "context" $) }}
{{- end }}
{{- if include "corvina-app-lib.redisEnabled" . }}
{{- with .Values.redis.auth.existingSecret }}
---
{{ include "corvina-app-lib.generatedSecret" (dict "name" . "data" (dict "redis-password" "{{ .password  }}") "context" $) }}
{{- end }}
{{- end }}
{{- end }}
