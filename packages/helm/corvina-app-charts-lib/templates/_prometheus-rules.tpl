{{/*
Pod health, CPU and memory alerts of the release namespace
*/}}
{{- define "corvina-app-charts-lib.prometheusRule.healthAlerts" -}}
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  labels:
    app: kube-prometheus-stack
  name: {{ .Values.prometheus.appName }}-prometheus-healthalerts.rules
  namespace: {{ .Release.Namespace }}
spec:
  groups:
    - name: {{ .Values.prometheus.appName }}-PrometheusHealthAlerts
      rules:
        - alert: {{ .Values.prometheus.appName }}-PodNotReady
          expr: kube_pod_status_phase{phase="Failed", namespace="{{ .Release.Namespace }}"} > 0
          for: 15m
          labels:
            severity: critical
          annotations:
            description: "Pod {{`{{ $labels.pod }}`}} is not ready."
        - alert: {{ .Values.prometheus.appName }}-PodCrashLooping
          expr: rate(kube_pod_container_status_restarts_total{namespace="{{ .Release.Namespace }}"}[5m]) > 0.1
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Pod {{`{{ $labels.pod }}`}} is crashing frequently"
            description: "Pod {{`{{ $labels.pod }}`}} in namespace {{ .Release.Namespace }} is restarting more than once every 5 minutes."
        - alert: {{ .Values.prometheus.appName }}-CpuUsage
          annotations:
            description: "System CPU Usage for {{ .Values.prometheus.appName }}"
            summary: "System CPU usage for {{ .Values.prometheus.appName }} is high and its more than 80%"
          expr: sum(node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{ namespace="{{ .Release.Namespace }}"}) / sum(kube_pod_container_resource_requests{job="kube-state-metrics",  namespace="{{ .Release.Namespace }}", resource="cpu"}) > 0.8
          for: 5m
          labels:
            severity: critical
        - alert: {{ .Values.prometheus.appName }}-MemoryUsage
          annotations:
            description: "Memory Utilisation for {{ .Values.prometheus.appName }}"
            summary: "Memory Utilisation for {{ .Values.prometheus.appName }} is high and its more than 80%"
          expr: sum(container_memory_working_set_bytes{job="kubelet", metrics_path="/metrics/cadvisor", namespace="{{ .Release.Namespace }}",container!="", image!=""}) / sum(kube_pod_container_resource_requests{job="kube-state-metrics", namespace="{{ .Release.Namespace }}", resource="memory"}) > 0.8
          for: 5m
          labels:
            severity: critical

{{- end }}

{{/*
5xx rate alerts on the Istio traffic
*/}}
{{- define "corvina-app-charts-lib.prometheusRule.istio" -}}
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: {{ .Values.prometheus.appName }}-prometheus-istio.rules
  namespace: {{ .Release.Namespace }}
spec:
  groups:
  - name: {{ .Values.prometheus.appName }}-istioAlerts
    rules:
      - alert: {{ .Values.prometheus.appName }}-HighErrorRate
        expr: increase(istio_requests_total{namespace="{{ .Release.Namespace }}", response_code=~"5.."}[5m]) / increase(istio_requests_total{namespace="{{ .Release.Namespace }}"}[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High rate of 5xx errors in Istio traffic"
          description: "Requests returning 5xx in the last 5m"

{{- end }}

{{/*
Resource quota usage alerts. Values: prometheus.appName
*/}}
{{- define "corvina-app-charts-lib.prometheusRule.resourceQuotas" -}}
kind: PrometheusRule
apiVersion: monitoring.coreos.com/v1
metadata:
  labels:
    app: kube-prometheus-stack
  name: {{ .Values.prometheus.appName }}-prometheus-resourcequota.rules
  namespace: {{ .Release.Namespace }}
spec:
  groups:
    - name: {{ .Values.prometheus.appName }}-PrometheusResourceQuotas
      rules:
      - alert: {{ .Values.prometheus.appName }}-CpuLimitResourceQuota
        annotations:
          description: "High CPU limit Usage for {{ .Release.Name }} in Resource Quotas"
          summary: "CPU limit usage for {{ .Release.Name }} is high and its more than 90% in Resource Quotas"
        expr: sum(kube_resourcequota{namespace="{{ .Release.Namespace }}", resource="limits.cpu", type="used"})/sum(kube_resourcequota{namespace="{{ .Release.Namespace }}", resource="limits.cpu", type="hard"}) * 100 > 90
        for: 5m
        labels:
          severity: critical
      - alert: {{ .Values.prometheus.appName }}-CpuRequestResourceQuota
        annotations:
          description: "High CPU request Usage for {{ .Release.Name }} in Resource Quotas"
          summary: "CPU request usage for {{ .Release.Name }} is high and its more than 90% in Resource Quotas"
        expr: sum(kube_resourcequota{namespace="{{ .Release.Namespace }}", resource="requests.cpu", type="used"})/sum(kube_resourcequota{namespace="{{ .Release.Namespace }}", resource="requests.cpu", type="hard"}) * 100 > 90
        for: 5m
        labels:
          severity: critical
      - alert: {{ .Values.prometheus.appName }}-MemoryLimitResourceQuota
        annotations:
          description: "High Memory limit Usage for {{ .Release.Name }} in Resource Quotas"
          summary: "Memory limit usage for {{ .Release.Name }} is high and its more than 90% in Resource Quotas"
        expr: sum(kube_resourcequota{namespace="{{ .Release.Namespace }}", resource="limits.memory", type="used"})/sum(kube_resourcequota{namespace="{{ .Release.Namespace }}", resource="limits.memory", type="hard"}) * 100 > 90
        for: 5m
        labels:
          severity: critical
      - alert: {{ .Values.prometheus.appName }}-MemoryRequestResourceQuota
        annotations:
          description: "High Memory request Usage for {{ .Release.Name }} in Resource Quotas"
          summary: "Memory request usage for {{ .Release.Name }} is high and its more than 90% in Resource Quotas"
        expr: sum(kube_resourcequota{namespace="{{ .Release.Namespace }}", resource="requests.memory", type="used"})/sum(kube_resourcequota{namespace="{{ .Release.Namespace }}", resource="requests.memory", type="hard"}) * 100 > 90
        for: 5m
        labels:
          severity: critical
      - alert: {{ .Values.prometheus.appName }}-StorageRequestResourceQuota
        annotations:
          description: "High Storage request Usage for {{ .Release.Name }} in Resource Quotas"
          summary: "Storage request usage for {{ .Release.Name }} is high and its more than 90% in Resource Quotas"
        expr: sum(kube_resourcequota{namespace="{{ .Release.Namespace }}", resource="requests.storage", type="used"})/sum(kube_resourcequota{namespace="{{ .Release.Namespace }}", resource="requests.storage", type="hard"}) * 100 > 90
        for: 5m
        labels:
          severity: critical

{{- end }}

{{/*
Container restart alerts
*/}}
{{- define "corvina-app-charts-lib.prometheusRule.infraAlerts" -}}
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  labels:
    app: kube-prometheus-stack
  name: {{ .Values.prometheus.appName }}-prometheus-infraalerts.rules
  namespace: {{ .Release.Namespace }}
spec:
  groups:
    - name: {{ .Values.prometheus.appName }}-PrometheusInfraAlerts
      rules:
        - alert: {{ .Values.prometheus.appName }}-Restarts
          expr: increase(kube_pod_container_status_restarts_total{namespace="{{ .Release.Namespace }}"}[5m])>0
          labels:
            severity: critical
          annotations:
            summary: "Container  {{`{{ $labels.k8sNamespace }}`}}/{{`{{ $labels.pod }}`}}/({{`{{ $labels.container }}`}}) restarted"
{{- end }}

{{/*
RabbitMQ alerts, only with rabbitmq. Values: prometheus.rabbitmqReadyMessagesThreshold, prometheus.rabbitmqUnacknowledgedMessagesThreshold,
prometheus.rabbitmqIgnoredQueues: queues left out of the growing queues and no consumer alerts (tpl allowed), e.g.
parking lots that nothing consumes on purpose
*/}}
{{- define "corvina-app-charts-lib.prometheusRule.rabbitmq" -}}
{{- if include "corvina-app-charts-lib.rabbitmqEnabled" . }}
{{- $ignoredQueues := "" }}
{{- range .Values.prometheus.rabbitmqIgnoredQueues }}
{{- $ignoredQueues = printf "%s, queue!=%q" $ignoredQueues (tpl . $) }}
{{- end }}
kind: PrometheusRule
apiVersion: monitoring.coreos.com/v1
metadata:
  labels:
    app: kube-prometheus-stack
  name: prometheus-rabbitmq.rules-{{ .Values.prometheus.appName }}
  namespace: {{ .Release.Namespace }}
spec:
  groups:
    - name: {{ .Values.prometheus.appName }}-RabbitMQNodeStatus
      rules:
        - alert: {{ .Values.prometheus.appName }}-RabbitMQDown
          expr: max_over_time(up{job="{{ .Values.rabbitmq.clusterName }}"} [5m] ) == 0
          for: 5m
          labels:
            severity: fail
          annotations:
            summary: RabbitMQ node is down

        - alert: {{ .Values.prometheus.appName }}-RabbitMQLowDiskFree
          expr: rabbitmq_core_node_disk_free{ namespace="{{ .Release.Namespace }}" } < rabbitmq_core_node_disk_free_limit{ namespace="{{ .Release.Namespace }}" } * 4
          for: 2m
          labels:
            severity: critical
          annotations:
            summary: RabbitMQ node free disk space is low.

        - alert: {{ .Values.prometheus.appName }}-RabbitMQcloseToHighWatermark
          expr: rabbitmq_disk_space_available_bytes{ namespace="{{ .Release.Namespace }}" } < rabbitmq_disk_space_available_limit_bytes{ namespace="{{ .Release.Namespace }}" } * 1.5
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: RabbitMQ disk space is close to high watermark.

        - alert: {{ .Values.prometheus.appName }}-RabbitMQHighWatermark
          expr: rabbitmq_disk_space_available_bytes{ namespace="{{ .Release.Namespace }}" } < rabbitmq_disk_space_available_limit_bytes{ namespace="{{ .Release.Namespace }}" }
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: RabbitMQ disk space is exceeded high watermark.

        - alert: {{ .Values.prometheus.appName }}-RabbitMQMemoryHighWatermark
          expr: (rabbitmq_process_resident_memory_bytes{ namespace="{{ .Release.Namespace }}" } / on(namespace, pod) kube_pod_container_resource_limits{resource="memory",pod=~"{{ .Values.rabbitmq.clusterName }}-server-.*"}) > 0.8
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "RabbitMQ Memory Usage High {{`{{ $labels.pod }}`}}"
            description: "RabbitMQ pod {{`{{ $labels.pod }}`}} in namespace {{`{{ $labels.namespace }}`}}  is using more than 80% of its memory limit."

        - alert: {{ .Values.prometheus.appName }}-RabbitMQMemoryFillingFast
          expr: rate(rabbitmq_process_resident_memory_bytes{ namespace="{{ .Release.Namespace }}" }[5m]) > 30000000
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "RabbitMQ Memory Filling Fast Alert"
            description: "The rate of RabbitMQ memory usage increase has exceeded the threshold in the last 5 minutes."

        - alert: {{ .Values.prometheus.appName }}-RabbitMQNoDiskFree
          expr: rabbitmq_disk_space_available_bytes{ namespace="{{ .Release.Namespace }}" } < rabbitmq_disk_space_available_limit_bytes{ namespace="{{ .Release.Namespace }}" }
          for: 1m
          labels:
            severity: fail
          annotations:
            summary: RabbitMQ node has no free disk.

    - name: {{ .Values.prometheus.appName }}-RabbitMQQueues
      rules:
        - alert: {{ .Values.prometheus.appName }}-RabbitMQGrowingQueues
          expr: deriv(rabbitmq_queue_messages_ready{ namespace="{{ .Release.Namespace }}"{{ $ignoredQueues }} }[5m]) > 0
          for: 5m
          labels:
            severity: fail
          annotations:
            summary: It looks like services are accumulating messages

        - alert: {{ .Values.prometheus.appName }}-RabbitMQReadyMessages
          expr: min_over_time(rabbitmq_queue_messages_ready{ namespace="{{ .Release.Namespace }}" }[5m]) > {{ .Values.prometheus.rabbitmqReadyMessagesThreshold }}
          for: 5m
          labels:
            severity: pre-fail
          annotations:
            summary: There are too many Ready messages on queues

        - alert: {{ .Values.prometheus.appName }}-RabbitMQUnacknowledgedMessages
          expr: ( ( (min_over_time(rabbitmq_queue_messages_unacked{ namespace="{{ .Release.Namespace }}" }[5m]) > bool 0 ) * on(namespace, service, queue) ( min_over_time(rabbitmq_queue_messages_unacked{ namespace="{{ .Release.Namespace }}" }[5m]) / on(namespace, service, queue) sum by (namespace, service, queue) (irate(rabbitmq_queue_messages_published_total{ namespace="{{ .Release.Namespace }}" }[5m]) ) ) ) ) > {{ .Values.prometheus.rabbitmqUnacknowledgedMessagesThreshold }}
          for: 5m
          labels:
            severity: fail
          annotations:
            summary: There are too many Unacknowledged messages on queues

    - name: {{ .Values.prometheus.appName }}-RabbitMQErlangVM
      rules:
        - alert: {{ .Values.prometheus.appName }}-RabbitMQLowAvailProcs
          expr: (erlang_vm_process_count{job="{{ .Values.rabbitmq.clusterName }}" } / erlang_vm_process_limit{job="{{ .Values.rabbitmq.clusterName }}"}) * 100 > 90
          for: 10m
          labels:
            severity: pre-fail
          annotations:
            summary: RabbitMQ is close to processes limit.

        - alert: {{ .Values.prometheus.appName }}-RabbitMQLowFreeFD
          expr: (rabbitmq_core_node_fd_used{ namespace="{{ .Release.Namespace }}" } / rabbitmq_core_node_fd_total{ namespace="{{ .Release.Namespace }}" }) * 100 > 90
          for: 10m
          labels:
            severity: pre-fail
          annotations:
            summary: RabbitMQ fd count is close to files descriptor limit.

    - name: {{ .Values.prometheus.appName }}-RabbitMQConsumers
      rules:
        - alert: {{ .Values.prometheus.appName }}-RabbitMQNoConsumer
          expr: rabbitmq_queue_consumers{ namespace="{{ .Release.Namespace }}"{{ $ignoredQueues }} } == 0
          for: 5m
          labels:
            severity: fail
          annotations:
            summary: No consumer attached to queue

{{- end }}
{{- end }}

{{/*
Redis alerts, only with redis
*/}}
{{- define "corvina-app-charts-lib.prometheusRule.redis" -}}
{{- if include "corvina-app-charts-lib.redisEnabled" . }}
kind: PrometheusRule
apiVersion: monitoring.coreos.com/v1
metadata:
  labels:
    app: kube-prometheus-stack
  name: prometheus-redis.rules-{{ .Values.prometheus.appName }}
  namespace: {{ .Release.Namespace }}
spec:
  groups:
    - name: {{ .Values.prometheus.appName }}-PrometheusRedisRules
      rules:
        - alert: {{ .Values.prometheus.appName }}-RedisConnectedClientsHigh
          expr: redis_connected_clients{ namespace="{{ .Release.Namespace }}" } / redis_config_maxclients{ namespace="{{ .Release.Namespace }}" } > 0.8
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High number of connected clients on Redis instance"
            description: "Redis instance is using more than 80% of its allowed client connections."
        - alert: {{ .Values.prometheus.appName }}-RedisInstanceDown
          expr: up{job="{{ .Values.prometheus.appName }}-redis-metrics", namespace="{{ .Release.Namespace }}" } == 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "Redis instance is down"
            description: "The Redis instance is unreachable."
        - alert: {{ .Values.prometheus.appName }}-RedisHighCPUUsage
          expr: rate(process_cpu_seconds_total{job="{{ .Values.prometheus.appName }}-redis-metrics", namespace="{{ .Release.Namespace }}" }[1m]) > 0.8
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High CPU usage on Redis instance"
            description: "Redis instance is consuming more than 80% of CPU."

{{- end }}
{{- end }}
