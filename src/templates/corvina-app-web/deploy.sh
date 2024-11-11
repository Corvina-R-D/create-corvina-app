#!/bin/bash

set -eo pipefail    

# Check if context is passed as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <context>"
  exit 1
fi

CONTEXT=$1
# Check if the terminal supports colors
if [ -n "$(tput colors)" ] && [ "$(tput colors)" -ge 8 ]; then
  BOLD=$(tput bold)
  NORMAL=$(tput sgr0)
  RED=$(tput setaf 1)
else
  BOLD=""
  NORMAL=""
fi

cd $(dirname $0)/helm-charts

HELM_DIFF_USE_UPGRADE_DRY_RUN=true helmfile -e $CONTEXT diff --color --context 6 | less

# ask for confirmation before applying changes
read -p "${BOLD}Do you want to apply the changes on ${RED}$CONTEXT${NORMAL}? (y/n) " -n 1 -r

if [[ $REPLY =~ ^[Yy]$ ]]
then
  helmfile -e $CONTEXT apply
fi
