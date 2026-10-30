{{/*
Env vars of the backend ConfigMap, as a dict: the defaults below, then .Values.service.config on top.
.Values.service.config values may use templates, e.g. MANIFEST_BRAND: '{{ .Values.service.envVar.BRAND }}'.
.Values.service.pgEnv: false drops the PG_* defaults, for apps that read the connection from other variables.
*/}}
{{- define "corvina-app-charts-lib.serviceConfig" -}}
{{- $envVar := .Values.service.envVar }}
{{- $baseUrl := printf "%s://%s:%v" .Values.gateway.protocol (.Values.gateway.appHost | required ".gateway.appHost is required") .Values.gateway.port }}
{{- $config := dict
  "LOG_LEVEL" $envVar.LOG_LEVEL
  "MANIFEST_BASE_URL" $baseUrl
  "MANIFEST_ID" (.Values.service.appId | required ".service.appId is required")
  "MANIFEST_API_VERSION" .Chart.AppVersion
  "MANIFEST_BASE_URL_FE_APP" $baseUrl
  "MANIFEST_BRAND" $envVar.MANIFEST_BRAND
  "INSTALLATION_HOSTS_WHITELIST" $envVar.INSTALLATION_HOSTS_WHITELIST
}}
{{- if eq (toString $envVar.NODE_TLS_REJECT_UNAUTHORIZED) "0" }}
{{- $_ := set $config "NODE_TLS_REJECT_UNAUTHORIZED" "0" }}
{{- end }}
{{- if ne (toString .Values.service.pgEnv) "false" }}
{{- $auth := .Values.postgresql.global.postgresql.auth }}
{{- $_ := set $config "PG_HOST" (include "corvina-app-charts-lib.postgresHost" .) }}
{{- $_ := set $config "PG_PORT" $envVar.PG_PORT }}
{{- $_ := set $config "PG_USER" $auth.username }}
{{- $_ := set $config "PG_DATABASE" $auth.database }}
{{- $_ := set $config "PG_MAX_QUERY_EXEC_TIME" $envVar.PG_MAX_QUERY_EXEC_TIME }}
{{- $_ := set $config "PG_POOL_MAX" $envVar.PG_POOL_MAX }}
{{- $_ := set $config "PG_QUERY_LOGGING" $envVar.PG_QUERY_LOGGING }}
{{- end }}
{{- if include "corvina-app-charts-lib.redisEnabled" . }}
{{- $_ := set $config "REDIS_HOST" (printf "%s-redis-headless" .Release.Name) }}
{{- $_ := set $config "REDIS_PORT" "6379" }}
{{- $_ := set $config "CACHE_DEFAULT_TTL" "30" }}
{{- end }}
{{- if include "corvina-app-charts-lib.rabbitmqEnabled" . }}
{{- $_ := set $config "RABBITMQ_HOST" .Values.rabbitmq.clusterName }}
{{- $_ := set $config "RABBITMQ_PORT" "5672" }}
{{- $_ := set $config "RABBITMQ_ADMIN_PORT" "15672" }}
{{- end }}
{{- range $key, $value := .Values.service.config }}
{{- $_ := set $config $key (tpl (toString $value) $) }}
{{- end }}
{{- range $key, $value := $config }}
{{- /* missing values render as empty strings, like they did inline */}}
{{- $_ := set $config $key (ternary "" (toString $value) (kindIs "invalid" $value)) }}
{{- end }}
{{- toYaml $config }}
{{- end }}

{{/*
Env vars of the backend containers (service Deployment and migrator Job) besides the ConfigMap
Usage: {{ include "corvina-app-charts-lib.serviceEnv" (dict "startFeatures" "app.listen" "context" $) }}
*/}}
{{- define "corvina-app-charts-lib.serviceEnv" -}}
{{- $ := .context -}}
- name: START_FEATURES
  value: {{ .startFeatures }}
- name: {{ include "corvina-app-charts-lib.postgresPasswordEnv" $ }}
  valueFrom:
    secretKeyRef:
      name: {{ $.Values.postgresql.global.postgresql.auth.existingSecret | default (print $.Release.Name "-postgresql") }}
      key: password
      optional: false
{{- if include "corvina-app-charts-lib.redisEnabled" $ }}
{{- if ne (toString (dig "auth" "enabled" true $.Values.redis)) "false" }}
- name: REDIS_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ $.Values.redis.auth.existingSecret | default (print $.Release.Name "-redis") }}
      key: {{ $.Values.redis.auth.existingSecretPasswordKey | default "redis-password" }}
      optional: false
{{- end }}
{{- end }}
{{- end }}

{{/*
Backend: the ConfigMap and the "service" backend workload below
Values:
  service.image, service.tag, service.resources, service.envVar.*, service.appId
  service.serviceName (default service-service), service.healthPath (default /v1/health),
  service.probeInitialDelaySeconds, service.postgresHost, service.postgresPasswordEnv (default PG_PASS),
  service.pgEnv, service.config, service.extraEnv, service.extraCa.secret,
  service.automountServiceAccountToken: true for backends calling the Kubernetes API,
  service.extraVolumes, service.extraVolumeMounts (tpl allowed)
*/}}
{{- define "corvina-app-charts-lib.service" -}}
{{ include "corvina-app-charts-lib.backend" (dict "context" . "serviceName" (include "corvina-app-charts-lib.serviceName" .) "extraEnv" .Values.service.extraEnv) }}
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: service-config
  namespace: {{ .Release.Namespace }}
  labels:
    app: service
    tier: app-service-deployment
data:
  {{- include "corvina-app-charts-lib.serviceConfig" . | nindent 2 }}
{{- end }}

{{/*
Backend workload: Deployment, Service, ServiceAccount and the RoleBinding to wait for the migrator Job. It runs the
backend image with the service-config ConfigMap and the service.* values; more backends of the same image (e.g. with
another role) are more includes with another name.
Usage: {{ include "corvina-app-charts-lib.backend" (dict "context" $ "name" "service-managed" "serviceName" "my-service" "extraEnv" (list ...)) }}
  name         Deployment <name>-deployment, container <name>, pods labelled app: <name>, ServiceAccount <name>-sa
               (default service)
  serviceName  Kubernetes Service (default <name>-service)
  extraEnv     env vars added to the container (tpl allowed), after the defaults
*/}}
{{- define "corvina-app-charts-lib.backend" -}}
{{- $ := .context }}
{{- $name := .name | default "service" }}
{{- $sa := printf "%s-sa" $name }}
{{- $healthPath := $.Values.service.healthPath }}
{{- $automountToken := eq (toString $.Values.service.automountServiceAccountToken) "true" }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ $name }}-deployment
  namespace: {{ $.Release.Namespace }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {{ $name }}
  template:
    metadata:
      labels:
        # not in the mesh: the NetworkPolicies don't allow the sidecar traffic
        sidecar.istio.io/inject: "false"
        app: {{ $name }}
      annotations:
        # env vars are read only at container start: roll the pods when the ConfigMap changes
        checksum/config: {{ include "corvina-app-charts-lib.serviceConfig" $ | sha256sum }}
    spec:
      serviceAccountName: {{ $sa }}
      automountServiceAccountToken: {{ $automountToken }}
      volumes:
        {{- if not $automountToken }}
        {{- include "corvina-app-charts-lib.kubeApiAccessVolume" $ | nindent 8 }}
        {{- end }}
        {{- with $.Values.service.extraVolumes }}
        {{- tpl (toYaml .) $ | nindent 8 }}
        {{- end }}
        {{- with $.Values.service.extraCa }}
        - name: extra-ca
          secret:
            secretName: {{ .secret }}
            items:
            - key: ca.crt
              path: ca.crt
        {{- end }}
      initContainers:
        - name: init
          image: {{ include "corvina-app-charts-lib.image.k8sWaitFor" $ }}
          securityContext:
            {{- include "corvina-app-charts-lib.containerSecurityContext" $ | nindent 12 }}
          imagePullPolicy: {{ $.Values.imagePullPolicy }}
          args:
            - "job-wr"
            - "-lcorvina.io/migrator={{ $.Release.Name }},corvina.io/image-tag={{ $.Values.service.tag }}"
          {{- if not $automountToken }}
          volumeMounts:
            {{- include "corvina-app-charts-lib.kubeApiAccessVolumeMount" $ | nindent 12 }}
          {{- end }}
          resources:
            requests:
              cpu: 100m
              memory: 64Mi
            limits:
              cpu: 100m
              memory: 64Mi
      containers:
        - name: {{ $name }}
          image: "{{ $.Values.service.image | required ".service.image is required" }}:{{ $.Values.service.tag | required ".service.tag is required" }}"
          securityContext:
            {{- include "corvina-app-charts-lib.containerSecurityContext" $ | nindent 12 }}
          imagePullPolicy: {{ $.Values.imagePullPolicy }}
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: service-config
          env:
            {{- include "corvina-app-charts-lib.serviceEnv" (dict "startFeatures" $.Values.service.envVar.START_FEATURES "context" $) | nindent 12 }}
            {{- if include "corvina-app-charts-lib.rabbitmqEnabled" $ }}
            - name: RABBITMQ_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ $.Values.rabbitmq.clusterName }}-default-user
                  key: password
                  optional: false
            - name: RABBITMQ_USERNAME
              valueFrom:
                secretKeyRef:
                  name: {{ $.Values.rabbitmq.clusterName }}-default-user
                  key: username
                  optional: false
            {{- end }}
            {{- with $.Values.service.extraCa }}
            - name: NODE_EXTRA_CA_CERTS
              value: /cacerts/ca.crt
            {{- end }}
            {{- with .extraEnv }}
            {{- tpl (toYaml .) $ | nindent 12 }}
            {{- end }}
          volumeMounts:
            {{- with $.Values.service.extraVolumeMounts }}
            {{- tpl (toYaml .) $ | nindent 12 }}
            {{- end }}
            {{- with $.Values.service.extraCa }}
            - name: extra-ca
              mountPath: /cacerts
            {{- end }}
          readinessProbe:
            httpGet:
              path: {{ $healthPath }}
              port: 3000
            {{- with $.Values.service.probeInitialDelaySeconds }}
            initialDelaySeconds: {{ . }}
            {{- end }}
          livenessProbe:
            httpGet:
              path: {{ $healthPath }}
              port: 3000
            {{- with $.Values.service.probeInitialDelaySeconds }}
            initialDelaySeconds: {{ . }}
            {{- end }}
          resources:
            {{- toYaml $.Values.service.resources | nindent 12 }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ .serviceName | default (printf "%s-service" $name) }}
  namespace: {{ $.Release.Namespace }}
spec:
  selector:
    app: {{ $name }} # the Service will expose all Pods with a label of app: {{ $name }}
  ports:
    - port: 80
      targetPort: 3000
      name: {{ $.Values.gateway.protocol }}-service-port
---
{{ include "corvina-app-charts-lib.serviceAccount" (dict "name" $sa "context" $) }}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: {{ $sa }}-watch-jobs-rb
  namespace: {{ $.Release.Namespace }}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: watch-jobs
subjects:
- kind: ServiceAccount
  name: {{ $sa }}
  namespace: {{ $.Release.Namespace }}
{{- end }}
