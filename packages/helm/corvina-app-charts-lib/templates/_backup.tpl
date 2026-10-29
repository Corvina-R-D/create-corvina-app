{{/*
Velero Schedule backing up the release namespace
Values: backup.enabled, backup.cron, backup.ttl, backup.storageLocation, backup.snapshotLocation
*/}}
{{- define "corvina-app-charts-lib.backup" -}}
{{ if .Values.backup.enabled }}
apiVersion: velero.io/v1
kind: Schedule
metadata:
  # Schedule names end up in labels: at most 63 characters
  name: {{ printf "%s-backup" (include "corvina-app-charts-lib.fullname" .) | trunc 63 | trimSuffix "-" }}
  namespace: velero
spec:
  schedule: {{ .Values.backup.cron }}
  template:
    metadata:
      labels:
        argocd.argoproj.io/instance: none
    includedNamespaces:
      - {{ .Release.Namespace }}
    ttl: {{ .Values.backup.ttl | default "72h30m0s" }}
    storageLocation: {{ .Values.backup.storageLocation }}
    volumeSnapshotLocations:
      - {{ .Values.backup.snapshotLocation }}
{{ end }}
{{- end }}
