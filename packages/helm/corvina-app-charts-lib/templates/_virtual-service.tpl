{{/*
VirtualService routing the backend prefixes to the backend Service and everything else to the frontend
Values:
  gateway.appHost, cors.*
  virtualService.servicePrefixes: URI prefixes served by the backend (default /v1 and /swagger-ui)
  virtualService.extraRoutes: Istio HTTP routes evaluated before the default ones (tpl allowed)
*/}}
{{- define "corvina-app-charts-lib.virtualService" -}}
{{- $cors := .Values.cors }}
{{- $virtualService := .Values.virtualService | default dict }}
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
  {{- with $virtualService.extraRoutes }}
  {{- tpl (toYaml .) $ | nindent 2 }}
  {{- end }}
  - match:
    {{- range ($virtualService.servicePrefixes | default (list "/v1" "/swagger-ui")) }}
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
