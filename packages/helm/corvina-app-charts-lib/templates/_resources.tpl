{{/*
Container resources, as the body of a resources: key.

  resources:
    {{- include "corvina-app-charts-lib.resources" (dict "context" $ "resources" $.Values.service.resources) | nindent 12 }}

With resourceShape: true (the corvina-k8s standard, see its utils/render-policy.py): no CPU limit, a
CPU request (10m when unset) and memory request == limit (the limit, else the request).
Otherwise the resources as given.
*/}}
{{- define "corvina-app-charts-lib.resources" -}}
{{- if not .context.Values.resourceShape -}}
{{- toYaml .resources -}}
{{- else -}}
{{- $res := deepCopy (.resources | default dict) -}}
{{- $req := $res.requests | default dict -}}
{{- $lim := $res.limits | default dict -}}
{{- $_ := unset $lim "cpu" -}}
{{- $_ := set $req "cpu" ($req.cpu | default "10m") -}}
{{- $memory := $lim.memory | default $req.memory -}}
{{- if $memory -}}
{{- $_ := set $req "memory" $memory -}}
{{- $_ := set $lim "memory" $memory -}}
{{- end -}}
{{- $res = dict "requests" $req -}}
{{- if $lim -}}{{- $_ := set $res "limits" $lim -}}{{- end -}}
{{- toYaml $res -}}
{{- end -}}
{{- end -}}

{{/*
priorityClassName line of a pod spec: the component's priorityClassName, else the chart's, else none.

  {{- include "corvina-app-charts-lib.priorityClassName" (dict "context" $ "class" $.Values.service.priorityClassName) | nindent 6 }}
*/}}
{{- define "corvina-app-charts-lib.priorityClassName" -}}
{{- with .class | default .context.Values.priorityClassName -}}
priorityClassName: {{ . }}
{{- end -}}
{{- end -}}
