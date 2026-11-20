{{/*
HTTPRoute sending the backend prefixes to the backend Service and everything else to the frontend
Values:
  gateway.appHost, cors.*
  httpRoute.servicePrefixes: URI prefixes served by the backend
  httpRoute.extraRules: Gateway API HTTPRoute rules evaluated before the default ones (tpl allowed); Gateway API
    picks the longest matching prefix, so the order is not significant; a rule with
    enabled: '{{ .Values.feature.enabled }}' is left out when it renders false
  cors.allowOrigins, cors.additionalOrigins: origins as <scheme>://<host>[:<port>], a wildcard may start the host
    (https://*.example.com); cors.exposeHeaders
*/}}
{{- define "corvina-app-charts-lib.httpRoute" -}}
{{- $cors := .Values.cors }}
{{- $httpRoute := .Values.httpRoute }}
{{- $appHost := .Values.gateway.appHost | required ".gateway.appHost is required" }}
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: app-host-route
  namespace: {{ .Release.Namespace }}
spec:
  parentRefs:
    - name: {{ include "corvina-app-charts-lib.gatewayName" . }}
  hostnames:
    - {{ $appHost | quote }}
    - {{ printf "*.%s" $appHost | quote }}
  rules:
    {{- range $httpRoute.extraRules }}
    {{- $rule := tpl (toYaml .) $ | fromYaml }}
    {{- if ne (toString (dig "enabled" true $rule)) "false" }}
    - {{- toYaml (omit $rule "enabled") | nindent 6 }}
    {{- end }}
    {{- end }}
    - matches:
        {{- range $httpRoute.servicePrefixes }}
        - path:
            type: PathPrefix
            value: {{ . }}
        {{- end }}
      {{- if $cors.enabled }}
      filters:
        - type: CORS
          cors:
            allowOrigins:
              {{- toYaml (concat $cors.allowOrigins ($cors.additionalOrigins | default list)) | nindent 14 }}
            allowMethods: [GET, POST, PATCH, PUT, DELETE, OPTIONS]
            allowHeaders: [authorization, content-type, accept]
            {{- if $cors.exposeHeaders }}
            exposeHeaders:
              {{- toYaml $cors.exposeHeaders | nindent 14 }}
            {{- end }}
            maxAge: 3600
            allowCredentials: false
      {{- end }}
      backendRefs:
        - name: {{ include "corvina-app-charts-lib.serviceName" . }}
          port: 80
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: app-service
          port: 80
{{- end }}
