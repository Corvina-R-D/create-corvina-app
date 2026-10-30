{{/*
Frontend: the "app" frontend workload below
Values: app.image, app.tag, app.resources, imagePullPolicy, gateway.protocol, workloadIdentity.gcpSaLinks.app-sa
*/}}
{{- define "corvina-app-charts-lib.app" -}}
{{ include "corvina-app-charts-lib.frontend" (dict "context" .) }}
{{- end }}

{{/*
Frontend workload: Deployment, Service and ServiceAccount of an nginx image serving on 8080, with the app.* resources.
More frontends (e.g. another flavour of the app) are more includes with another name.
Usage: {{ include "corvina-app-charts-lib.frontend" (dict "context" $ "name" "app-managed" "image" "my-image" "tag" "1.0.0") }}
  name   Deployment <name>-deployment, container <name>, pods labelled app: <name>, Service <name>-service,
         ServiceAccount <name>-sa (default app)
  image  default .Values.app.image
  tag    default .Values.app.tag
*/}}
{{- define "corvina-app-charts-lib.frontend" -}}
{{- $ := .context }}
{{- $name := .name | default "app" }}
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
    spec:
      serviceAccountName: {{ $name }}-sa
      automountServiceAccountToken: false
      containers:
        - name: {{ $name }}
          image: "{{ .image | default $.Values.app.image | required ".app.image is required" }}:{{ .tag | default $.Values.app.tag | required ".app.tag is required" }}"
          securityContext:
            {{- include "corvina-app-charts-lib.containerSecurityContext" $ | nindent 12 }}
          imagePullPolicy: {{ $.Values.imagePullPolicy }}
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /
              port: 8080
          livenessProbe:
            httpGet:
              path: /
              port: 8080
          resources:
            {{- toYaml $.Values.app.resources | nindent 12 }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ $name }}-service
  namespace: {{ $.Release.Namespace }}
spec:
  selector:
    app: {{ $name }} # the Service will expose all Pods with a label of app: {{ $name }}
  ports:
    - port: 80
      targetPort: 8080
      name: {{ $.Values.gateway.protocol }}-app-port
---
{{ include "corvina-app-charts-lib.serviceAccount" (dict "name" (printf "%s-sa" $name) "context" $) }}
{{- end }}
