{{/*
Scrapes the Istio ingress gateway
*/}}
{{- define "corvina-app-lib.serviceMonitor.istio" -}}
{{- $istioValues := index .Values "istio-gateway" }}
kind: ServiceMonitor
apiVersion: monitoring.coreos.com/v1
metadata:
  labels:
    app: {{ $istioValues.name }}
  name: {{ $istioValues.name }}
  namespace: {{ .Release.Namespace }}
spec:
  endpoints:
    - path: /stats/prometheus
      targetPort: http-envoy-prom
  namespaceSelector:
    matchNames:
      - {{ .Release.Namespace }}
  selector:
    matchLabels:
      app: {{ $istioValues.name }}

{{- end }}

{{/*
Scrapes RabbitMQ, only with rabbitmq
*/}}
{{- define "corvina-app-lib.serviceMonitor.rabbitmq" -}}
{{- if include "corvina-app-lib.rabbitmqEnabled" . }}
kind: ServiceMonitor
apiVersion: monitoring.coreos.com/v1
metadata:
  labels:
    app: {{ .Values.rabbitmq.clusterName }}
  name: {{ .Values.rabbitmq.clusterName }}
  namespace: {{ .Release.Namespace }}
spec:
  endpoints:
    - path: /metrics/per-object
      port: prometheus
  namespaceSelector:
    matchNames:
      - {{ .Release.Namespace }}
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ .Values.rabbitmq.clusterName }}
{{- end }}
{{- end }}
