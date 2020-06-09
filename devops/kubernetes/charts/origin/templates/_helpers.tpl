{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this
(by the DNS naming spec).
*/}}
{{- define "fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "bridge.fullname" -}}
{{- printf "%s-%s" .Release.Name "bridge" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "bridge.host" -}}
{{- $prefix := "bridge" -}}
{{- if ne .Release.Namespace "prod" -}}
{{- printf "%s.%s.originprotocol.com" $prefix .Release.Namespace -}}
{{- else -}}
{{- printf "%s.originprotocol.com" $prefix -}}
{{- end -}}
{{- end -}}

{{- define "dapp.fullname" -}}
{{- printf "%s-%s" .Release.Name "dapp" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "dapp.host" -}}
{{- if ne .Release.Namespace "prod" -}}
{{- printf "dapp.%s.originprotocol.com" .Release.Namespace -}}
{{- else -}}
{{- printf "shoporigin.com" -}}
{{- end -}}
{{- end -}}

{{- define "faucet.fullname" -}}
{{- printf "%s-%s" .Release.Name "faucet" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "faucet.host" -}}
{{- if eq .Release.Namespace "prod" -}}
{{- printf "faucet.originprotocol.com" }}
{{- else -}}
{{- printf "faucet.%s.originprotocol.com" .Release.Namespace -}}
{{- end -}}
{{- end -}}

{{- define "ipfs.fullname" -}}
{{- printf "%s-%s" .Release.Name "ipfs" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "ipfs.host" -}}
{{- $prefix := "ipfs" -}}
{{- if ne .Release.Namespace "prod" -}}
{{- printf "%s.%s.originprotocol.com" $prefix .Release.Namespace -}}
{{- else -}}
{{- printf "%s.originprotocol.com" $prefix -}}
{{- end -}}
{{- end -}}

{{- define "ipfsProxy.fullname" -}}
{{- printf "%s-%s" .Release.Name "ipfs-proxy" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "ipfsCluster.fullname" -}}
{{- printf "%s-%s" .Release.Name "ipfs-cluster" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "ipfsCluster.host" -}}
{{- $prefix := "fs" -}}
{{- if ne .Release.Namespace "prod" -}}
{{- printf "%s.%s.originprotocol.com" $prefix .Release.Namespace -}}
{{- else -}}
{{- printf "%s.originprotocol.com" $prefix -}}
{{- end -}}
{{- end -}}

{{- define "messaging.fullname" -}}
{{- printf "%s-%s" .Release.Name "messaging" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "messaging.host" -}}
{{- $prefix := "messaging" -}}
{{- if ne .Release.Namespace "prod" -}}
{{- printf "%s.%s.originprotocol.com" $prefix .Release.Namespace -}}
{{- else -}}
{{- printf "%s.originprotocol.com" $prefix -}}
{{- end -}}
{{- end -}}

{{- define "eventlistener.fullname" -}}
{{- printf "%s-%s" .Release.Name "eventlistener" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "discovery.fullname" -}}
{{- printf "%s-%s" .Release.Name "discovery" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "discovery.host" -}}
{{- $prefix := "discovery" -}}
{{- if ne .Release.Namespace "prod" -}}
{{- printf "%s.%s.originprotocol.com" $prefix .Release.Namespace -}}
{{- else -}}
{{- printf "%s.originprotocol.com" $prefix -}}
{{- end -}}
{{- end -}}

{{- define "growth.fullname" -}}
{{- printf "%s-%s" .Release.Name "growth" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "growth.host" -}}
{{- if eq .Release.Namespace "prod" -}}
{{- printf "growth.originprotocol.com" }}
{{- else -}}
{{- printf "growth.%s.originprotocol.com" .Release.Namespace -}}
{{- end -}}
{{- end -}}

{{- define "notifications.fullname" -}}
{{- printf "%s-%s" .Release.Name "notifications" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "notifications.host" -}}
{{- $prefix := "notifications" -}}
{{- if ne .Release.Namespace "prod" -}}
{{- printf "%s.%s.originprotocol.com" $prefix .Release.Namespace -}}
{{- else -}}
{{- printf "%s.originprotocol.com" $prefix -}}
{{- end -}}
{{- end -}}

{{- define "linking.fullname" -}}
{{- printf "%s-%s" .Release.Name "linking" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "linking.host" -}}
{{- $prefix := "linking" -}}
{{- if ne .Release.Namespace "prod" -}}
{{- printf "%s.%s.originprotocol.com" $prefix .Release.Namespace -}}
{{- else -}}
{{- printf "%s.originprotocol.com" $prefix -}}
{{- end -}}
{{- end -}}

{{- define "creator.fullname" -}}
{{- printf "%s-%s" .Release.Name "creator" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "creator-server.fullname" -}}
{{- printf "%s-%s" .Release.Name "creator-server" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "creator.host" -}}
{{- $prefix := "creator" -}}
{{- if ne .Release.Namespace "prod" -}}
{{- printf "%s.%s.originprotocol.com" $prefix .Release.Namespace -}}
{{- else -}}
{{- printf "%s.originprotocol.com" $prefix -}}
{{- end -}}
{{- end -}}

{{- define "creator-dapp.fullname" -}}
{{- printf "%s-%s" .Release.Name "creator-dapp" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "creator-dapp.host" -}}
{{- if ne .Release.Namespace "prod" -}}
{{- printf "%s.origindapp.com" .Release.Namespace -}}
{{- else -}}
{{- printf "origindapp.com" -}}
{{- end -}}
{{- end -}}

{{- define "creator-issuer.fullname" -}}
{{- printf "%s-%s" .Release.Name "creator-issuer" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "cron.fullname" -}}
{{- printf "%s-%s" .Release.Name "cron" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "admin.fullname" -}}
{{- printf "%s-%s" .Release.Name "admin" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "ipfs-issuer.fullname" -}}
{{- printf "%s-%s" .Release.Name "ipfs-issuer" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "ipfs-cluster-issuer.fullname" -}}
{{- printf "%s-%s" .Release.Name "ipfs-cluster-issuer" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "admin.host" -}}
{{- $prefix := "admin" -}}
{{- if ne .Release.Namespace "prod" -}}
{{- printf "%s.%s.originprotocol.com" $prefix .Release.Namespace -}}
{{- else -}}
{{- printf "%s.originprotocol.com" $prefix -}}
{{- end -}}
{{- end -}}

{{- define "relayer.fullname" -}}
{{- printf "%s-%s" .Release.Name "relayer" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "relayer.host" -}}
{{- if eq .Release.Namespace "prod" -}}
{{- printf "relayer.originprotocol.com" }}
{{- else -}}
{{- printf "relayer.%s.originprotocol.com" .Release.Namespace -}}
{{- end -}}
{{- end -}}

{{- define "graphql.fullname" -}}
{{- printf "%s-%s" .Release.Name "graphql" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "graphql.host" -}}
{{- if eq .Release.Namespace "prod" -}}
{{- printf "graphql.originprotocol.com" }}
{{- else -}}
{{- printf "graphql.%s.originprotocol.com" .Release.Namespace -}}
{{- end -}}
{{- end -}}

{{- define "t3.fullname" -}}
{{- printf "%s-%s" .Release.Name "t3" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "t3-investor.host" -}}
{{- if eq .Release.Namespace "prod" -}}
{{- printf "investor.originprotocol.com" }}
{{- else -}}
{{- printf "investor.%s.originprotocol.com" .Release.Namespace -}}
{{- end -}}
{{- end -}}

{{- define "t3-employee.host" -}}
{{- if eq .Release.Namespace "prod" -}}
{{- printf "team.originprotocol.com" }}
{{- else -}}
{{- printf "team.%s.originprotocol.com" .Release.Namespace -}}
{{- end -}}
{{- end -}}

{{- define "auth.fullname" -}}
{{- printf "%s-%s" .Release.Name "auth" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "auth.host" -}}
{{- if eq .Release.Namespace "prod" -}}
{{- printf "auth.originprotocol.com" }}
{{- else -}}
{{- printf "auth.%s.originprotocol.com" .Release.Namespace -}}
{{- end -}}
{{- end -}}
