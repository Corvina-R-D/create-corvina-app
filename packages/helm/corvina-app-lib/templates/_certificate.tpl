{{/*
TLS certificate of the app host: Let's Encrypt (DNS01 on Cloud DNS) for public hosts, the minikube fake CA for
<appName>.corvina.mk
Values: gateway.protocol, gateway.appHost, gateway.certificateSecretName, gateway.issuer.*
*/}}
{{- define "corvina-app-lib.certificate" -}}
{{ $PROTOCOL := (.Values.gateway.protocol | upper) }}
{{ $appHost := .Values.gateway.appHost | required ".gateway.appHost is required" }}
{{ $appName := include "corvina-app-lib.appName" . }}
{{ if and (eq $PROTOCOL "HTTPS") (or (hasSuffix ".io" $appHost) (hasSuffix ".cloud" $appHost) (hasSuffix ".com" $appHost)) }}
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: {{ .Values.gateway.issuer.name }}
  namespace: {{ .Release.Namespace }}
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    preferredChain: ISRG Root X1
    email: "monitoring@exorint.com"
    # Name of a secret used to store the ACME account private key
    privateKeySecretRef:
      name: corvina-{{ $appName }}-acme
    solvers:
      - dns01:
          cloudDNS:
            project: {{ .Values.gateway.issuer.gcpProject | required "Missing gcpNetworkingProject value in envs" }}
            hostedZoneName: {{ .Values.gateway.issuer.gcpZoneName }}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: corvina-{{ $appName }}-app-certificate
  namespace: {{ .Release.Namespace }}
spec:
  secretName: {{ .Values.gateway.certificateSecretName }}
  issuerRef:
    # The issuer created previously
    name: {{ .Values.gateway.issuer.name }}
  dnsNames:
  - {{ .Values.gateway.appHost | quote }}
  - {{ printf "*.%s" .Values.gateway.appHost | quote }}
{{ end }}

{{ if and (eq $PROTOCOL "HTTPS") (eq $appHost (printf "%s.corvina.mk" $appName)) }}
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: corvina-{{ $appName }}-app-certificate
  namespace: {{ .Release.Namespace }}
spec:
  secretName: {{ .Values.gateway.certificateSecretName }}
  issuerRef:
    kind: ClusterIssuer
    name: minikube-fake-letsencrypt-ca
  dnsNames:
  - {{ .Values.gateway.appHost | quote }}
  - {{ printf "*.%s" .Values.gateway.appHost | quote }}
{{- end }}
{{- end }}
