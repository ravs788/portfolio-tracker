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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
