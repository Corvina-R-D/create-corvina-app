{{/*
Frontend: Deployment, Service and ServiceAccount
Values: app.image, app.tag, app.resources, imagePullPolicy, gateway.protocol, workloadIdentity.gcpSaLinks.app-sa
*/}}
{{- define "corvina-app-charts-lib.app" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
  namespace: {{ .Release.Namespace }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: app
  template:
    metadata:
      labels:
        app: app
    spec:
      serviceAccountName: app-sa
      automountServiceAccountToken: false
      containers:
        - name: app
          image: "{{ .Values.app.image | required ".app.image is required" }}:{{ .Values.app.tag | required ".app.tag is required" }}"
          securityContext:
            {{- include "corvina-app-charts-lib.containerSecurityContext" . | nindent 12 }}
          imagePullPolicy: {{ .Values.imagePullPolicy }}
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
            {{- toYaml .Values.app.resources | nindent 12 }}
---
apiVersion: v1
kind: Service
metadata:
  name: app-service
  namespace: {{ .Release.Namespace }}
spec:
  selector:
    app: app # the Service will expose all Pods with a label of app: app
  ports:
    - port: 80
      targetPort: 8080
      name: {{ .Values.gateway.protocol }}-app-port
---
{{ include "corvina-app-charts-lib.serviceAccount" (dict "name" "app-sa" "context" .) }}
{{- end }}
