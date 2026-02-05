# Joint Portfolio Planner

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
![GitHub version](https://img.shields.io/badge/version-0.0.1-green.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

Joint Portfolio Planner is a React-based web application designed to help couples plan their financial future by projecting incomes, expenses, investments, and loans over a specified horizon.

## Features

- **Multi-Step Wizard**: Guided input for general settings, incomes, expenses, big expenses, investments, and loans.
- **Yearly Projections**: Calculate and display detailed yearly financial projections.
- **Tentative Expenses**: Option to include or exclude tentative expenses in calculations.
- **Export Options**: Export results to CSV or JSON for further analysis.
- **Persistent State**: Uses Zustand with persistence to save user inputs locally.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/joint-portfolio-planner.git
   cd joint-portfolio-planner
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## Usage

- Navigate through the wizard steps to input your financial data.
- Review the summary in the final step.
- View detailed yearly projections in the results section.
- Toggle tentative expenses and export data as needed.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

## Deploy to Azure App Service

This project is ready to run on Azure App Service (Linux) with a Node 20 runtime:
- Build: Vite (`npm run build`) produces `dist/`
- Serve: Express (`server.js`) serves `dist/` and handles SPA fallback
- Start script: `npm start` → `node server.js`
- Port: Binds to `process.env.PORT` (provided by Azure)

Recommended deployment: GitHub Actions + Publish Profile, with server-side build using Oryx.

Prerequisites
- Azure subscription and an App Service Web App (Linux)
- This repository hosted on GitHub
- Node 20 targeted (already set in package.json "engines")

Option A — Azure Portal + GitHub Actions (Publish Profile)
1) Create the Web App (Linux, Node 20 LTS)
   - Azure Portal → App Services → Create → Runtime: Node 20 (Linux)
   - Note the Web App name (e.g., portfolio-tracker-prod)

2) Configure App Settings (App Service → Configuration → Application settings)
   - SCM_DO_BUILD_DURING_DEPLOYMENT = true
   - WEBSITE_NODE_DEFAULT_VERSION   = 20
   - NPM_CONFIG_PRODUCTION          = false
   Save and restart the app.

3) Add Publish Profile as GitHub Secret
   - In the Web App → Get publish profile → Copy contents
   - GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
     - Name: AZURE_WEBAPP_PUBLISH_PROFILE
     - Value: (paste the XML)

4) Update workflow with your app name
   - File: .github/workflows/azure-appservice.yml
   - Set env.AZURE_WEBAPP_NAME to your Web App name
   - Push to main (or use the Run workflow button). The workflow zip-deploys the repo and Oryx builds on Azure.

5) Verify deployment
   - Browse https://YOUR_WEBAPP_NAME.azurewebsites.net
   - Check Logs → Deployment Center or Container Settings if needed

Option B — Azure CLI (create resources + settings)
You can create the App Service resources and configure settings via CLI. Example:
- Install/Update Azure CLI: https://learn.microsoft.com/cli/azure/install-azure-cli
- Login: az login

Replace placeholders (LOCATION, RG_NAME, PLAN_NAME, WEBAPP_NAME):

  az group create --name RG_NAME --location LOCATION
  az appservice plan create --name PLAN_NAME --resource-group RG_NAME --sku B1 --is-linux
  az webapp create --name WEBAPP_NAME --resource-group RG_NAME --plan PLAN_NAME --runtime "NODE|20-lts"
  az webapp config appsettings set \
    --resource-group RG_NAME \
    --name WEBAPP_NAME \
    --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true WEBSITE_NODE_DEFAULT_VERSION=20

Then complete Option A steps 3–4 for GitHub secret and workflow variable.

Notes/Troubleshooting
- Build on Azure: Oryx runs npm install and npm run build when SCM_DO_BUILD_DURING_DEPLOYMENT=true.
- If your build fails due to missing devDependencies (Vite/TypeScript), ensure NPM_CONFIG_PRODUCTION=false is set.
- Start command: App Service runs npm start by default; this repo’s start is "node server.js".
- Heroku Procfile: Not used by Azure but safe to keep.
- GitHub Actions warnings in editors about "actions/checkout" or "azure/webapps-deploy" may be false-positive validations; they resolve on GitHub runners.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
