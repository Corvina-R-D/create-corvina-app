{{/*
VirtualService routing the backend prefixes to the backend Service and everything else to the frontend
Values:
  gateway.appHost, cors.*
  virtualService.servicePrefixes: URI prefixes served by the backend
  virtualService.extraRoutes: Istio HTTP routes evaluated before the default ones (tpl allowed); a route with
    enabled: '{{ .Values.feature.enabled }}' is left out when it renders false
*/}}
{{- define "corvina-app-charts-lib.virtualService" -}}
{{- $cors := .Values.cors }}
{{- $virtualService := .Values.virtualService }}
{{- $appHost := .Values.gateway.appHost | required ".gateway.appHost is required" }}
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: app-host-vs
  namespace: {{ .Release.Namespace }}
spec:
  hosts:
  - "{{ $appHost }}"
  - '*.{{ $appHost }}'
  gateways:
  - {{ include "corvina-app-charts-lib.appName" . }}-gateway
  http:
  {{- range $virtualService.extraRoutes }}
  {{- $route := tpl (toYaml .) $ | fromYaml }}
  {{- if ne (toString (dig "enabled" true $route)) "false" }}
  - {{- toYaml (omit $route "enabled") | nindent 4 }}
  {{- end }}
  {{- end }}
  - match:
    {{- range $virtualService.servicePrefixes }}
    - uri:
        prefix: {{ . }}
    {{- end }}
    route:
    - destination:
        port:
          number: 80
        host: {{ include "corvina-app-charts-lib.serviceName" . }}
    {{- if $cors.enabled }}
    corsPolicy:
      allowOrigins:
        {{- toYaml $cors.allowOrigins | nindent 8 }}
        {{- if $cors.additionalOrigins }}
        {{- range $cors.additionalOrigins }}
        - regex: {{ . | quote }}
        {{- end }}
        {{- end }}
      allowMethods:
        - GET
        - POST
        - PATCH
        - PUT
        - DELETE
        - OPTIONS
      allowHeaders:
        - authorization
        - content-type
        - accept
      {{- if $cors.exposeHeaders }}
      exposeHeaders:
        {{- toYaml $cors.exposeHeaders | nindent 8 }}
      {{- end }}
      maxAge: "3600s"
      allowCredentials: false
    {{- end }}
  - match:
    - uri:
        prefix: /
    route:
    - destination:
        port:
          number: 80
        host: app-service
{{- end }}
