{{/*
Istio Gateway for the app host, access logging and the optional TLS fingerprints in the access log
Values: gateway.appHost, gateway.port, gateway.protocol, gateway.certificateSecretName, istio-gateway.name, tlsClientLogging
*/}}
{{- define "corvina-app-charts-lib.gateway" -}}
{{ $PROTOCOL := (.Values.gateway.protocol | upper) }}
{{ $ISTIO_GATEWAY := index .Values "istio-gateway" }}
{{ $appName := include "corvina-app-charts-lib.appName" . }}
{{ $appHost := .Values.gateway.appHost | required ".gateway.appHost is required" }}
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: {{ $appName }}-gateway
  namespace: {{ .Release.Namespace }}
spec:
  selector:
    istio: '{{ $ISTIO_GATEWAY.name | replace "istio-" "" }}'
  servers:
    - hosts:
        - '{{ $appHost }}'
        - '*.{{ $appHost }}'
      port:
        name: {{ $appName }}-app
        number: {{ .Values.gateway.port }}
        protocol: {{ $PROTOCOL }}
      {{ if eq $PROTOCOL "HTTPS" }}
      tls:
        mode: SIMPLE
        credentialName: {{ .Values.gateway.certificateSecretName }}
      {{ end }}
---
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: mesh-default
  namespace: {{ .Release.Namespace }}
spec:
  # enable access logging (you can see those logs in the $ISTIO_GATEWAY.name pod)
  accessLogging:
    - providers:
      - name: envoy
{{- if .Values.tlsClientLogging }}
---
# TLS client fingerprints for the access log (%TLS_JA4_FINGERPRINT%)
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: tls-fingerprints
  namespace: {{ .Release.Namespace }}
spec:
  configPatches:
  - applyTo: LISTENER_FILTER
    match:
      context: GATEWAY
      listener:
        listenerFilter: envoy.filters.listener.tls_inspector
    patch:
      # not MERGE: before istio/istio#61835 it merges into every listener filter and mutates istiod's
      # shared default
      operation: REPLACE
      value:
        name: envoy.filters.listener.tls_inspector
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.listener.tls_inspector.v3.TlsInspector
          initial_read_buffer_size: 512  # Istio's default
          enable_ja3_fingerprinting: true
          enable_ja4_fingerprinting: true
{{- end }}
{{- end }}
