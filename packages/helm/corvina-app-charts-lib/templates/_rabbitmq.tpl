{{/*
RabbitMQ cluster, its PodDisruptionBudget, the fake default user for minikube and the topology
Values:
  rabbitmq.clusterName, rabbitmq.replicas, rabbitmq.image, rabbitmq.storageClass, rabbitmq.storageSize,
  rabbitmq.resources, rabbitmq.fakeAuth, rabbitmq.additionalConfig (extra rabbitmq.conf lines)
  rabbitmq.topology.queues: [{name, durable, autoDelete, type, arguments}]
  rabbitmq.topology.exchanges: [{name, type, durable, autoDelete, arguments}]
  rabbitmq.topology.bindings: [{name, source, destination, destinationType, routingKey, arguments}]
  Topology fields may use templates, e.g. name: '{{ .Values.rabbitmq.alarmQueue }}'
*/}}
{{- define "corvina-app-charts-lib.rabbitmq" -}}
{{- if include "corvina-app-charts-lib.rabbitmqEnabled" . }}
{{- $_ := .Values.rabbitmq.clusterName | required ".rabbitmq.clusterName is required" }}
apiVersion: rabbitmq.com/v1beta1
kind: RabbitmqCluster
metadata:
  name: {{ .Values.rabbitmq.clusterName }}
spec:
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - podAffinityTerm:
          labelSelector:
            matchLabels:
              app.kubernetes.io/name: {{ .Values.rabbitmq.clusterName }}
          topologyKey: kubernetes.io/hostname
        weight: 100
  {{- with .Values.rabbitmq.resources }}
  resources:
    {{ toYaml . | nindent 4 }}
  {{- end }}
  replicas: {{ .Values.rabbitmq.replicas }}
  image: {{ .Values.rabbitmq.image | default (include "corvina-app-charts-lib.image" (dict "context" . "name" "rabbitmq")) }}
  persistence:
    storageClassName: {{ .Values.rabbitmq.storageClass }}
    storage: {{ .Values.rabbitmq.storageSize }}
  rabbitmq:
    additionalConfig: |
      queue_leader_locator: balanced
      cluster_partition_handling: pause_minority
      {{- with .Values.rabbitmq.additionalConfig }}
      {{- . | trim | nindent 6 }}
      {{- end }}
    additionalPlugins:
        - rabbitmq_management
        - rabbitmq_peer_discovery_k8s
        - rabbitmq_shovel
        - rabbitmq_shovel_management
        - rabbitmq_prometheus
        - rabbitmq_consistent_hash_exchange
        - rabbitmq_top
        - rabbitmq_delayed_message_exchange
        - rabbitmq_stream
  {{- if .Values.rabbitmq.fakeAuth }}
  secretBackend:
    externalSecret:
      name: "{{ .Values.rabbitmq.clusterName }}-default-user"
  {{- end }}
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ .Values.rabbitmq.clusterName }}
spec:
  maxUnavailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ .Values.rabbitmq.clusterName }}
{{- if .Values.rabbitmq.fakeAuth }}
---
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Values.rabbitmq.clusterName }}-default-user
type: Opaque
stringData:
  type: rabbitmq
  provider: rabbitmq
  host: {{ .Values.rabbitmq.clusterName }}
  default_user.conf: |
    default_user = admin
    default_pass = password
  username: admin
  password: password
  port: "5672"
  stream-port: "5552"
{{- end }}
{{- include "corvina-app-charts-lib.rabbitmq.topology" . }}
{{- end }}
{{- end }}

{{- define "corvina-app-charts-lib.rabbitmq.topology" -}}
{{- $topology := .Values.rabbitmq.topology | default dict }}
{{- range $kind, $key := dict "Queue" "queues" "Exchange" "exchanges" "Binding" "bindings" }}
{{- range (index $topology $key) }}
{{- $spec := fromYaml (tpl (toYaml .) $) }}
{{- $name := $spec.name }}
{{- if eq $kind "Binding" }}
{{- $_ := unset $spec "name" }}
{{- $_ := set $spec "destinationType" ($spec.destinationType | default "queue") }}
{{- end }}
{{- $_ := set $spec "rabbitmqClusterReference" (dict "name" $.Values.rabbitmq.clusterName "namespace" $.Release.Namespace) }}
---
apiVersion: rabbitmq.com/v1beta1
kind: {{ $kind }}
metadata:
  name: {{ $name }}
  namespace: {{ $.Release.Namespace }}
spec:
  {{- toYaml $spec | nindent 2 }}
{{- end }}
{{- end }}
{{- end }}
