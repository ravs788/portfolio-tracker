# ARM Template Deployment (Azure App Service)

This folder contains an ARM template to provision the infrastructure needed to run this application on Azure App Service (Linux, Node 20).

Resources created
- App Service Plan (Linux) with configurable SKU (defaults to Basic B1)
- Web App (Linux) configured for Node 20
- Application Settings:
  - SCM_DO_BUILD_DURING_DEPLOYMENT = true
  - WEBSITE_NODE_DEFAULT_VERSION   = 20
  - NPM_CONFIG_PRODUCTION          = false
- Optional: Application Insights (enabled by default) wired to the Web App

Files
- azuredeploy.json — ARM template
- azuredeploy.parameters.json — sample parameters (edit as needed)

Parameters to set
- webAppName (required): Must be globally unique (used for https://<webAppName>.azurewebsites.net)
- location (optional): Defaults to the resource group’s location
- SKU parameters (optional): skuName, skuTier, skuSize, skuCapacity
- enableAppInsights (optional): true/false

Prerequisites
- Azure CLI installed and logged in
  - az login
  - az account set --subscription "<your-subscription-name-or-id>"
- Resource group (this deployment targets: rg-new)

Deploy commands

Option 1 — Windows (cmd.exe)
1) Set variables:
   set WEBAPP_NAME=your-unique-webapp-name
2) (Optional) Create the resource group if it does not exist:
   az group create --name rg-new --location centralindia
3) Deploy the template:
   az deployment group create ^
     --resource-group rg-new ^
     --name appsvc-deploy ^
     --template-file infra/azure/azuredeploy.json ^
     --parameters @infra/azure/azuredeploy.parameters.json ^
     --parameters webAppName=%WEBAPP_NAME%
4) Get the Web App URL:
   az deployment group show -g rg-new -n appsvc-deploy --query properties.outputs.webAppUrl.value -o tsv

Option 2 — Windows PowerShell
1) Set variables:
   $env:WEBAPP_NAME = "your-unique-webapp-name"
2) (Optional) Create the resource group:
   az group create --name rg-new --location centralindia
3) Deploy the template:
   az deployment group create `
     --resource-group rg-new `
     --name appsvc-deploy `
     --template-file infra/azure/azuredeploy.json `
     --parameters @infra/azure/azuredeploy.parameters.json `
     --parameters webAppName=$env:WEBAPP_NAME
4) Get the Web App URL:
   az deployment group show -g rg-new -n appsvc-deploy --query properties.outputs.webAppUrl.value -o tsv

Option 3 — macOS/Linux (bash)
1) Set variables:
   export WEBAPP_NAME=your-unique-webapp-name
2) (Optional) Create the resource group:
   az group create --name rg-new --location eastus
3) Deploy the template:
   az deployment group create \
     --resource-group rg-new \
     --name appsvc-deploy \
     --template-file infra/azure/azuredeploy.json \
     --parameters @infra/azure/azuredeploy.parameters.json \
     --parameters webAppName=$WEBAPP_NAME
4) Get the Web App URL:
   az deployment group show -g rg-new -n appsvc-deploy --query properties.outputs.webAppUrl.value -o tsv

Post-deployment (CI/CD)
- In Azure Portal: Web App → Get publish profile → copy XML
- In GitHub Repo: Settings → Secrets and variables → Actions → New repository secret
  - Name: AZURE_WEBAPP_PUBLISH_PROFILE
  - Value: (paste publish profile XML)
- Edit .github/workflows/azure-appservice.yml: set AZURE_WEBAPP_NAME to the same WEBAPP_NAME you deployed
- Push to main or run the workflow manually to deploy via GitHub Actions (Oryx builds on Azure)

Notes
- The ARM template sets the app settings required for server-side build (Oryx) and Node version.
- WEBAPP_NAME must be globally unique; pick something like joint-portfolio-planner-xyz.
- If you change SKU or enable/disable App Insights, update azuredeploy.parameters.json accordingly.

## Troubleshooting: Zip Deploy 409 Conflict

Why this happens
- Another deployment is already in progress, or Kudu (ZipDeploy) is holding a lock on the site.

Mitigations
- The GitHub Actions workflow in this repo now:
  - Logs in with the publish profile
  - Stops the Web App before Zip Deploy
  - Retries once on failure
  - Starts the Web App after deployment
- If you need to do it manually via CLI:

  az webapp stop --name <YOUR_WEBAPP_NAME> --resource-group rg-new
  # wait ~10–20 seconds
  az webapp start --name <YOUR_WEBAPP_NAME> --resource-group rg-new

Portal steps
- App Service → Deployment Center → Cancel/stop any active deployment.
- App Service → Overview → Stop; wait ~10–20 seconds; Start.
- Re-run the GitHub Actions workflow.

Ensure only one run at a time
- The workflow uses a concurrency guard to prevent overlapping deployments on the same branch/ref.

Secret hygiene (Publish Profile)
- Never commit .PublishSettings files. This repo ignores them via .gitignore.
- If a publish profile was committed at any point:
  1) Remove the file from the repo and push:
     git rm --cached infra/azure/<file>.PublishSettings
     git commit -m "Remove publish profile"
     git push
  2) Rotate the publish profile in Azure Portal (Web App → Get publish profile → Reset publish profile).
  3) Update the GitHub secret AZURE_WEBAPP_PUBLISH_PROFILE with the new XML.
  4) (Optional) Purge from history using GitHub’s “Remove sensitive data” guidance or tools like git filter-repo/BFG.
