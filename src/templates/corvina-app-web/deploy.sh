#!/bin/bash

set -eo pipefail    

# Check if environment name is passed as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <environment-name> [--no-diff]"
  exit 1
fi

ENVIRONMENT=$1
NO_DIFF=false

# Check for --no-diff option
if [ $# -eq 2 ] && [ "$2" == "--no-diff" ]; then
  NO_DIFF=true
fi

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

if [ "$NO_DIFF" = false ]; then
  HELM_DIFF_USE_UPGRADE_DRY_RUN=true helmfile -e $ENVIRONMENT diff --color --context 6 | less

  # ask for confirmation before applying changes
  read -p "${BOLD}Do you want to apply the changes on ${RED}$ENVIRONMENT${NORMAL}? (y/n) " -n 1 -r

  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo
    echo "Aborting."
    exit 1
  fi
fi

helmfile -e $ENVIRONMENT sync