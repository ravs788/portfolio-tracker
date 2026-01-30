# Portfolio Planner – Mermaid Documentation

This document captures the planned system using Mermaid diagrams for quick, visual understanding.

## 1) System Overview (Architecture)
```mermaid
graph TD
  U[User] --> UI[React UI / MUI]
  UI --> FW[Form Wizard - React Hook Form]
  FW --> Zod[Validation - Zod]
  FW --> AppState[App State]
  AppState --> Persist[(localStorage)]
  FW --> Calc[Calculation Engine]
  Calc --> Infl[Inflation Adjustments]
  Calc --> Loans[Loan Module - Amortization]
  Calc --> Invest[Investment Module - Monthly Compounding]
  Calc --> Grid[Yearly Grid Builder]
  Grid --> Table[TanStack Table]
  UI --> Export[Export - CSV & JSON]
```

## 2) Wizard / User Flow
```mermaid
flowchart TD
  Start([Start]) --> General[Step 1: General\n- Start year\n- Horizon years\n- Currency\n- Inflation %]
  General --> Incomes[Step 2: Incomes\n- You: base + growth\n- Wife: base + growth\n- Monthly/Annual]
  Incomes --> MExp[Step 3: Monthly Expenses\n- Fixed list\n- Tentative list - toggle include\n- Inflation-linked]
  MExp --> BExp[Step 4: Yearly Big Expenses\n- Year - absolute or relative\n- Amount\n- Recurrence\n- Inflation-linked]
  BExp --> Invest[Step 5: Investments\n- Current corpus\n- Monthly contribution\n- Expected annual return %]
  Invest --> Loans[Step 6: Loans\n- Principal\n- APR %\n- Tenure in months\n- Start month and year]
  Loans --> Review[Review and Validate]
  Review -->|Valid| Calculate[Calculate]
  Review -->|Errors| General
  Calculate --> Results[Results: Yearly Grid + Toggles + Export]
```

## 3) Domain Model (Types)
```mermaid
classDiagram
  class Settings {
    +number startYear
    +number horizonYears
    +string currency
    +number inflationRate
  }

  class Income {
    +string person  "you|wife"
    +number baseAmount
    +boolean baseIsMonthly
    +number annualGrowthRate
  }

  class MonthlyExpense {
    +string name
    +number amountMonthly
    +boolean inflationLinked
    +boolean tentative
  }

  class BigExpense {
    +string name
    +number amount
    +number year
    +number recurrenceYears
    +boolean inflationLinked
  }

  class InvestmentPlan {
    +number currentCorpus
    +number monthlyContribution
    +number expectedAnnualReturn
  }

  class Loan {
    +string name
    +number principal
    +number apr
    +number tenureMonths
    +number startYear
    +number startMonth
  }

  class PlanInput {
    +Settings settings
    +Income[] incomes
    +MonthlyExpense[] monthlyExpenses
    +BigExpense[] bigExpenses
    +InvestmentPlan investment
    +Loan[] loans
  }

  class YearResult {
    +number year
    +number incomeYou
    +number incomeWife
    +number totalIncome
    +number fixedAnnual
    +number tentativeAnnual
    +number bigAnnual
    +number loanInterest
    +number loanPrincipal
    +number loansTotal
    +number investmentContrib
    +number netSavings
    +number corpusEnd
  }

  class PlanOutput {
    +YearResult[] results
  }

  PlanInput --> Settings : has
  PlanInput --> Income : includes
  PlanInput --> MonthlyExpense : includes
  PlanInput --> BigExpense : includes
  PlanInput --> InvestmentPlan : includes
  PlanInput --> Loan : includes
  PlanOutput --> YearResult : contains
```

## 4) End-to-End Calculation Sequence
```mermaid
sequenceDiagram
  participant UI as UI
  participant Z as Zod Validator
  participant E as Engine
  participant L as Loans
  participant I as Investments

  UI->>Z: validate(PlanInput)
  Z-->>UI: ok | errors
  UI->>E: calculate(PlanInput)
  E->>L: amortize(loans, startYear..endYear)
  L-->>E: yearlyLoanBreakdown
  E->>I: project(investment, monthlyContribs, range)
  I-->>E: yearlyCorpus
  E-->>UI: PlanOutput (YearResult[])
  UI-->>UI: render table + export
```

## 5) Yearly Grid Build (Per Year)
```mermaid
flowchart LR
  A[Year i] --> B["Income_you = base_you*(1+gy)^i"]
  A --> C["Income_wife = base_wife*(1+gw)^i"]
  B --> D["Total Income = you + wife"]
  C --> D
  A --> E["Fixed = Σ items: (m*12)*(1+infl)^i if linked"]
  A --> F["Tentative = Σ tentatives (if toggle on)"]
  A --> G["Big = Σ scheduled that year<br/>inflation applied if linked"]
  A --> H["Loans = Sum interest+principal<br/>for months in this calendar year"]
  A --> J["InvContrib = monthlyContribution * months"]
  D --> K["Total Expenses = Fixed + Tentative + Big + Loans + InvContrib"]
  K --> L["Net Savings = Total Income - Total Expenses"]
  J --> M["Corpus End = InvestModule(corpusStart,<br/>contribs, monthly return)"]
  L --> N["Row: {year, totals, net, corpusEnd}"]
```

## 6) Loan Amortization Logic
```mermaid
flowchart TD
  S([Start]) --> P["Inputs: principal P, APR, tenure n, start ym"]
  P --> R["r = APR/12"]
  R --> EMI["EMI = P*r*(1+r)^n / ((1+r)^n - 1)"]
  EMI --> LOOP{for each month until n or balance <= 0}
  LOOP -->|month m| INT["interest = balance * r"]
  INT --> PR["principal = EMI - interest"]
  PR --> NB["balance = balance - principal"]
  NB --> AGG["Aggregate by calendar year:<br/>Σinterest, Σprincipal"]
  AGG --> LOOP
  LOOP -->|done| OUT["Per-year totals:<br/>loanInterest, loanPrincipal, loansTotal"]
```

## 7) Investment Projection (Monthly Compounding)
```mermaid
flowchart TD
  S([Start]) --> I1["Inputs: corpus0, monthlyContrib, annualReturn"]
  I1 --> R["r = annualReturn/12"]
  R --> M{for each month in horizon}
  M -->|m| ADD["corpus += monthlyContrib"]
  ADD --> CMP["corpus *= (1 + r)"]
  CMP --> YAGG["Aggregate end-of-year corpus<br/>and Σcontribs for that year"]
  YAGG --> M
  M -->|done| OUT["yearly corpusEnd, contribTotals"]
```

## 8) Tentative Expense Toggle State
```mermaid
stateDiagram-v2
  [*] --> Viewing
  Viewing --> TentativeOn: toggle includeTentative = true
  Viewing --> TentativeOff: toggle includeTentative = false
  TentativeOn --> Recalc: trigger recompute
  TentativeOff --> Recalc: trigger recompute
  Recalc --> Viewing: render updated grid
```

## 9) Delivery Plan (Gantt)
```mermaid
gantt
  dateFormat  YYYY-MM-DD
  title MVP Milestones

  section Setup
  Scaffold + Tooling           :a1, 2026-01-24, 1d

  section Data + Forms
  Schemas + Validation          :a2, after a1, 1d
  Form Wizard (all steps)       :a3, after a2, 2d

  section Engine
  Core Calc (income/expenses)   :b1, after a3, 1d
  Loans Amortization            :b2, after b1, 1d
  Investments Projection        :b3, after b2, 1d

  section UI + Output
  Yearly Grid + Export          :c1, after b3, 1d
  Persist + Polishing           :c2, after c1, 1d
  Deploy                        :c3, after c2, 0.5d
```

### Rendering Tips
- Use a Mermaid-enabled Markdown preview (e.g., VSCode with “Markdown Preview Mermaid Support”).
- For GitHub, consider embedding via a site that renders Mermaid or use a static site build step that converts Mermaid to SVG.
