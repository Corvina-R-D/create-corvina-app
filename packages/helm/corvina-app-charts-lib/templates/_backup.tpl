{{/*
Velero Schedule backing up the release namespace
Values: backup.enabled, backup.cron, backup.ttl, backup.storageLocation, backup.snapshotLocation
*/}}
{{- define "corvina-app-charts-lib.backup" -}}
{{ if .Values.backup.enabled }}
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: {{ include "corvina-app-charts-lib.fullname" . }}-backup
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
