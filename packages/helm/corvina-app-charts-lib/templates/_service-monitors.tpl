{{/*
Scrapes the Envoy stats of the generated gateway
*/}}
{{- define "corvina-app-charts-lib.podMonitor.istioGateway" -}}
{{- $gateway := include "corvina-app-charts-lib.gatewayName" . }}
kind: PodMonitor
apiVersion: monitoring.coreos.com/v1
metadata:
  labels:
    app: {{ $gateway }}
  name: {{ $gateway }}
  namespace: {{ .Release.Namespace }}
spec:
  podMetricsEndpoints:
    - path: /stats/prometheus
      port: http-envoy-prom
  namespaceSelector:
    matchNames:
      - {{ .Release.Namespace }}
  selector:
    matchLabels:
      gateway.networking.k8s.io/gateway-name: {{ $gateway }}
{{- end }}

{{/*
Scrapes RabbitMQ, only with rabbitmq
*/}}
{{- define "corvina-app-charts-lib.serviceMonitor.rabbitmq" -}}
{{- if include "corvina-app-charts-lib.rabbitmqEnabled" . }}
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
