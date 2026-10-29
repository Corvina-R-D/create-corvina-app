{{/*
NetworkPolicy of one workload, adapted from corvina-k8s corvina-common.networkPolicy.

  {{ include "corvina-app-charts-lib.networkPolicy" (dict "context" $ "workload" "service" "podLabels" (dict "app" "service") "spec" $spec) }}

  workload   name of the policy (<workload>-netpol) and key of its overrides in .Values.networkPolicy.<workload>
  podLabels  labels of the selected pods
  spec       defaults of the workload, merged with .Values.networkPolicy.<workload>:
    dns               egress to the cluster DNS on port 53, true by default; the metadata server stays closed
    peers             egress to pods: [{name, podLabels, namespace, ports}]; no ports means every port
    apiServer         egress to the Kubernetes API (.Values.networkPolicy.apiServer.cidr)
    internetPorts     egress to the public internet: 0.0.0.0/0 except .Values.networkPolicy.privateCidrs
    anywherePorts     egress to any address, private ones included
    workloadIdentity  egress to the GKE metadata server, for pods using workload identity
    from              ingress from pods or addresses: [{name, podLabels, namespace, cidr, ports}]
    metricsPorts      ingress from prometheus
    extraPeers, extraFrom, extraEgress, extraIngress  additions from the values (the last two raw rules)
Ports are the container ports of the destination pods: numbers, names, or {port, endPort} ranges.
*/}}
{{- define "corvina-app-charts-lib.networkPolicy" -}}
{{- $ := .context -}}
{{- $np := $.Values.networkPolicy | default dict -}}
{{- $spec := mergeOverwrite (deepCopy .spec) (deepCopy (index $np .workload | default dict)) -}}
{{- $egress := list -}}
{{- if ne (toString $spec.dns) "false" }}
{{- $egress = append $egress (dict
  "to" (list (dict "namespaceSelector" (dict "matchLabels" (dict "kubernetes.io/metadata.name" "kube-system"))) (dict "ipBlock" (dict "cidr" "169.254.0.0/16")))
  "ports" (list (dict "port" 53 "protocol" "UDP") (dict "port" 53 "protocol" "TCP"))) }}
{{- end }}
{{- range concat ($spec.peers | default list) ($spec.extraPeers | default list) }}
{{- $egress = append $egress (include "corvina-app-charts-lib.networkPolicy.peerRule" (dict "peer" . "direction" "to") | fromYaml) }}
{{- end }}
{{- if $spec.apiServer }}
{{- $apiServer := $np.apiServer | default dict }}
{{- $egress = append $egress (dict
  "to" (list (dict "ipBlock" (dict "cidr" ($apiServer.cidr | required "networkPolicy.apiServer.cidr is required (kubeApiServerCidr of the environment)"))))
  "ports" (list (dict "port" ($apiServer.port | default 443) "protocol" "TCP"))) }}
{{- end }}
{{- with $spec.internetPorts }}
{{- $egress = append $egress (dict
  "to" (list (dict "ipBlock" (dict "cidr" "0.0.0.0/0" "except" ($np.privateCidrs | default (list "10.0.0.0/8" "100.64.0.0/10" "169.254.0.0/16" "172.16.0.0/12" "192.168.0.0/16")))))
  "ports" (include "corvina-app-charts-lib.networkPolicy.ports" . | fromYamlArray)) }}
{{- end }}
{{- with $spec.anywherePorts }}
{{- $egress = append $egress (dict "to" (list (dict "ipBlock" (dict "cidr" "0.0.0.0/0"))) "ports" (include "corvina-app-charts-lib.networkPolicy.ports" . | fromYamlArray)) }}
{{- end }}
{{- if $spec.workloadIdentity }}
{{- /* the GKE metadata server answers on 169.254.169.254:80, served by gke-metadata-server on 169.254.169.252:988 */}}
{{- $egress = append $egress (dict "to" (list (dict "ipBlock" (dict "cidr" "169.254.169.254/32"))) "ports" (list (dict "port" 80 "protocol" "TCP"))) }}
{{- $egress = append $egress (dict "to" (list (dict "ipBlock" (dict "cidr" "169.254.169.252/32"))) "ports" (list (dict "port" 988 "protocol" "TCP"))) }}
{{- end }}
{{- $egress = concat $egress ($spec.extraEgress | default list) }}
{{- $ingress := list -}}
{{- range concat ($spec.from | default list) ($spec.extraFrom | default list) }}
{{- $ingress = append $ingress (include "corvina-app-charts-lib.networkPolicy.peerRule" (dict "peer" . "direction" "from") | fromYaml) }}
{{- end }}
{{- with $spec.metricsPorts }}
{{- $prometheus := $np.prometheus | default (dict "namespace" "prometheus-system" "podLabels" (dict "app.kubernetes.io/name" "prometheus")) }}
{{- $ingress = append $ingress (include "corvina-app-charts-lib.networkPolicy.peerRule" (dict "peer" (merge (dict "ports" .) $prometheus) "direction" "from") | fromYaml) }}
{{- end }}
{{- $ingress = concat $ingress ($spec.extraIngress | default list) }}
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ .workload }}-netpol
  namespace: {{ $.Release.Namespace }}
  labels:
    {{- include "corvina-app-charts-lib.labels" $ | nindent 4 }}
spec:
  podSelector:
    matchLabels:
      {{- toYaml .podLabels | nindent 6 }}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    {{- if $ingress }}
    {{- toYaml $ingress | nindent 4 }}
    {{- else }} []
    {{- end }}
  egress:
    {{- if $egress }}
    {{- toYaml $egress | nindent 4 }}
    {{- else }} []
    {{- end }}
{{- end }}

{{- /* rule of a peer: {"peer": {podLabels, namespace, cidr, ports}, "direction": "to"|"from"} */}}
{{- define "corvina-app-charts-lib.networkPolicy.peerRule" -}}
{{- $peer := .peer -}}
{{- $selector := dict -}}
{{- if $peer.cidr }}
{{- $_ := set $selector "ipBlock" (dict "cidr" $peer.cidr) }}
{{- else }}
{{- $_ := set $selector "podSelector" (dict "matchLabels" ($peer.podLabels | default dict)) }}
{{- with $peer.namespace }}
{{- $_ := set $selector "namespaceSelector" (dict "matchLabels" (dict "kubernetes.io/metadata.name" .)) }}
{{- end }}
{{- end }}
{{- $rule := dict .direction (list $selector) }}
{{- with $peer.ports }}
{{- $_ := set $rule "ports" (include "corvina-app-charts-lib.networkPolicy.ports" . | fromYamlArray) }}
{{- end }}
{{- toYaml $rule }}
{{- end }}

{{- /* TCP ports: numbers, names or {port, endPort} */}}
{{- define "corvina-app-charts-lib.networkPolicy.ports" -}}
{{- $ports := list -}}
{{- range . }}
{{- if kindIs "map" . }}
{{- $ports = append $ports (merge (dict "protocol" "TCP") .) }}
{{- else }}
{{- $ports = append $ports (dict "port" . "protocol" "TCP") }}
{{- end }}
{{- end }}
{{- toYaml $ports }}
{{- end }}

{{/*
Pod labels admitted by the bitnami postgresql and redis NetworkPolicies (allowExternal: false), for the pods
connecting to them. Usage, inside a pod template labels block: {{ include "corvina-app-charts-lib.dataClientLabels" . }}
*/}}
{{- define "corvina-app-charts-lib.dataClientLabels" -}}
{{ .Release.Name }}-postgresql-client: "true"
{{- if include "corvina-app-charts-lib.redisEnabled" . }}
{{ .Release.Name }}-redis-client: "true"
{{- end }}
{{- end }}

{{/*
Policies of the app workloads: frontend, backend, migrator, registration
*/}}
{{- define "corvina-app-charts-lib.networkPolicy.gatewayPeer" -}}
{{- $istioGateway := index .Values "istio-gateway" -}}
name: istio-gateway
podLabels:
  istio: {{ $istioGateway.name | replace "istio-" "" | quote }}
{{- end }}

{{- define "corvina-app-charts-lib.networkPolicy.dataPeers" -}}
- name: postgresql
  podLabels:
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/name: postgresql
  ports: [5432]
{{- if include "corvina-app-charts-lib.redisEnabled" . }}
- name: redis
  podLabels:
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/name: redis
  ports: [6379]
{{- end }}
{{- end }}

{{- define "corvina-app-charts-lib.networkPolicy.app" -}}
{{- $gateway := include "corvina-app-charts-lib.networkPolicy.gatewayPeer" . | fromYaml }}
{{- $spec := dict "dns" false "from" (list (merge (dict "ports" (list 8080)) $gateway)) }}
{{- include "corvina-app-charts-lib.networkPolicy" (dict "context" . "workload" "app" "podLabels" (dict "app" "app") "spec" $spec) }}
{{- end }}

{{- define "corvina-app-charts-lib.networkPolicy.service" -}}
{{- $gateway := include "corvina-app-charts-lib.networkPolicy.gatewayPeer" . | fromYaml }}
{{- $peers := include "corvina-app-charts-lib.networkPolicy.dataPeers" . | fromYamlArray }}
{{- if include "corvina-app-charts-lib.rabbitmqEnabled" . }}
{{- $peers = append $peers (dict "name" "rabbitmq" "podLabels" (dict "app.kubernetes.io/name" .Values.rabbitmq.clusterName) "ports" (list 5672 5552 15672)) }}
{{- end }}
{{- $spec := dict
  "from" (list (merge (dict "ports" (list 3000)) $gateway))
  "peers" $peers
  "apiServer" true
  "internetPorts" (list 443)
  "workloadIdentity" (not (empty (dig "gcpSaLinks" "service-sa" "" (.Values.workloadIdentity | default dict))))
}}
{{- include "corvina-app-charts-lib.networkPolicy" (dict "context" . "workload" "service" "podLabels" (dict "app" "service") "spec" $spec) }}
{{- end }}

{{- define "corvina-app-charts-lib.networkPolicy.migrator" -}}
{{- $spec := dict
  "peers" (include "corvina-app-charts-lib.networkPolicy.dataPeers" . | fromYamlArray)
  "apiServer" true
  "workloadIdentity" (not (empty (dig "gcpSaLinks" "migrator-sa" "" (.Values.workloadIdentity | default dict))))
}}
{{- include "corvina-app-charts-lib.networkPolicy" (dict "context" . "workload" "migrator" "podLabels" (dict "app" "migrator") "spec" $spec) }}
{{- end }}

{{- define "corvina-app-charts-lib.networkPolicy.registration" -}}
{{- if (.Values.registration | default dict).enabled }}
{{- /* core and keycloak of the same cluster, and the app manifest through the app host (private on minikube) */}}
{{- $spec := dict
  "peers" (list (dict "name" "corvina" "namespace" .Values.registration.namespace))
  "anywherePorts" (list 443)
}}
{{- include "corvina-app-charts-lib.networkPolicy" (dict "context" . "workload" "registration" "podLabels" (dict "app" "registration") "spec" $spec) }}
{{- end }}
{{- end }}

{{/*
Policies of the infrastructure pods of the namespace: istio gateway, istiod, rabbitmq
*/}}
{{- define "corvina-app-charts-lib.networkPolicy.gateway" -}}
{{- $gateway := include "corvina-app-charts-lib.networkPolicy.gatewayPeer" . | fromYaml }}
{{- $spec := dict
  "from" (list
    (dict "name" "clients" "cidr" "0.0.0.0/0" "ports" (list .Values.gateway.port))
    (dict "name" "device-ext-authz" "namespace" "prod" "podLabels" (dict "istio" "corvina-device-ext-authz-ingress") "ports" (list .Values.gateway.port)))
  "metricsPorts" (list 15090 15020)
  "peers" (list
    (dict "name" "frontend" "podLabels" (dict "app" "app") "ports" (list 8080))
    (dict "name" "backend" "podLabels" (dict "app" "service") "ports" (list 3000))
    (dict "name" "istiod" "podLabels" (dict "app" "istiod" "istio.io/rev" .Release.Name) "ports" (list 15012)))
}}
{{- include "corvina-app-charts-lib.networkPolicy" (dict "context" . "workload" "gateway" "podLabels" $gateway.podLabels "spec" $spec) }}
{{- end }}

{{- define "corvina-app-charts-lib.networkPolicy.istiod" -}}
{{- $gateway := include "corvina-app-charts-lib.networkPolicy.gatewayPeer" . | fromYaml }}
{{- $apiServer := (.Values.networkPolicy | default dict).apiServer | default dict }}
{{- $spec := dict
  "from" (list
    (merge (dict "ports" (list 15012)) $gateway)
    (dict "name" "validation-webhook" "cidr" ($apiServer.cidr | default "") "ports" (list 15017)))
  "metricsPorts" (list 15014)
  "apiServer" true
}}
{{- include "corvina-app-charts-lib.networkPolicy" (dict "context" . "workload" "istiod" "podLabels" (dict "app" "istiod" "istio.io/rev" .Release.Name) "spec" $spec) }}
{{- end }}

{{- define "corvina-app-charts-lib.networkPolicy.rabbitmq" -}}
{{- if include "corvina-app-charts-lib.rabbitmqEnabled" . }}
{{- $cluster := dict "app.kubernetes.io/name" .Values.rabbitmq.clusterName }}
{{- $spec := dict
  "from" (list
    (dict "name" "backend" "podLabels" (dict "app" "service") "ports" (list 5672 5552 15672))
    (dict "name" "stasher" "podLabels" (dict "app.kubernetes.io/name" "stasher") "ports" (list 5672 5552))
    (dict "name" "operators" "namespace" "rabbitmq-system" "ports" (list 15672))
    (dict "name" "peers" "podLabels" $cluster))
  "metricsPorts" (list 15692)
  "peers" (list (dict "name" "peers" "podLabels" $cluster))
  "apiServer" true
}}
{{- include "corvina-app-charts-lib.networkPolicy" (dict "context" . "workload" "rabbitmq" "podLabels" $cluster "spec" $spec) }}
{{- end }}
{{- end }}
