{{- /* the Job name carries a hash of the whole Job: a changed template is a new Job, never an update of an immutable one */}}
{{- define "corvina-app-charts-lib.migrator.job" }}
  labels:
    corvina.io/migrator: {{ .Release.Name }}
    corvina.io/image-tag: "{{ .Values.service.tag }}"
  namespace: {{ .Release.Namespace }}
  {{- if and (not .Values.global.argocdManagement) .Release.IsUpgrade }}
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-delete-policy": before-hook-creation
  {{- end }}
spec:
  template:
    metadata:
      labels:
        sidecar.istio.io/inject: "false"
        app: migrator
        {{- include "corvina-app-charts-lib.dataClientLabels" . | trim | nindent 8 }}
    spec:
      serviceAccountName: migrator-sa
      automountServiceAccountToken: false
      volumes:
        {{- include "corvina-app-charts-lib.kubeApiAccessVolume" . | nindent 8 }}
      initContainers:
        - name: psql-wait
          image: europe-docker.pkg.dev/corvina-exorint/dockerhub-remote/groundnuty/k8s-wait-for:v2.0
          securityContext:
            {{- include "corvina-app-charts-lib.nobodySecurityContext" . | nindent 12 }}
          imagePullPolicy: {{ .Values.imagePullPolicy }}
          args:
            - "service"
            - "{{ include "corvina-app-charts-lib.postgresHost" . }}"
          volumeMounts:
            {{- include "corvina-app-charts-lib.kubeApiAccessVolumeMount" . | nindent 12 }}
          resources:
            {{- toYaml .Values.service.resources | nindent 12 }}
      containers:
      - name: service
        image: "{{ .Values.service.image | required ".service.image is required" }}:{{ .Values.service.tag | required ".service.tag is required" }}"
        securityContext:
          {{- include "corvina-app-charts-lib.containerSecurityContext" . | nindent 10 }}
        imagePullPolicy: {{ .Values.imagePullPolicy }}
        resources:
          {{- toYaml .Values.service.resources | nindent 10 }}
        envFrom:
        - configMapRef:
            name: service-config
        env:
          {{- include "corvina-app-charts-lib.serviceEnv" (dict "startFeatures" .Values.migrator.envVar.START_FEATURES "context" .) | nindent 10 }}
          {{- with .Values.service.extraEnv }}
          {{- tpl (toYaml .) $ | nindent 10 }}
          {{- end }}
      restartPolicy: Never # prevent pod removal on job failure so that we can inspect logs
  backoffLimit: 100
{{- end }}

{{/*
Migrator: the Job running the database migrations, with its ServiceAccount and RBAC to wait for postgresql
Values: migrator.envVar.START_FEATURES, plus the service.* image, resources and env values
*/}}
{{- define "corvina-app-charts-lib.migrator" -}}
{{- $job := include "corvina-app-charts-lib.migrator.job" . }}
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ .Release.Name }}-migr-{{ $job | sha256sum | trunc 10 }}"
{{- $job }}
---
{{ include "corvina-app-charts-lib.serviceAccount" (dict "name" "migrator-sa" "context" .) }}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: {{ .Release.Namespace }}
  name: migrator-role
rules:
- apiGroups: [""]
  resources: ["services", "pods"]
  verbs: ["get", "watch", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: migrator-rb
  namespace: {{ .Release.Namespace }}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: migrator-role
subjects:
- kind: ServiceAccount
  name: migrator-sa
  namespace: {{ .Release.Namespace }}
{{- end }}
