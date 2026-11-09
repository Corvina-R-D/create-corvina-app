#!/bin/bash

export app_name=[| .Name |]
export gcp_project=[| .GcpProject |]
export create_corvina_app_creation_options="[| .CreateCorvinaAppCreationOptions |]"
export create_corvina_app_version="[| .CreateCorvinaAppVersion |]"

set -u