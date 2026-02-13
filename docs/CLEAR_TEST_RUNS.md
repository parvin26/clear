# CLEAR test runs – 5 founder profiles

Automated run of the full diagnostic flow (POST /api/clear/diagnostic/run) plus decision, readiness, and chat/start for each scenario.

---

## Test 1 – Seed B2B SaaS, runway vs growth

**Decision ID:** `aadcce68-209a-4443-aafe-fb26c498833f`

### Inputs

**Onboarding:**
```json
{
  "name": "Aisha",
  "country": "Malaysia",
  "industry": "B2B SaaS \u2013 workflow automation",
  "company_size": "11\u201320",
  "email": "aisha@company.com"
}
```

**Wizard (diagnostic_data):**
```json
{
  "businessStage": "Growing but unstable",
  "situationDescription": "We are a seed-stage B2B SaaS company at around RM60k MRR, growing 8\u201310% per month but with a lot of volatility. We have about 9\u201310 months of cash runway and I'm torn between hiring sales/marketing to push growth or cutting burn to extend runway. I don't fully trust our cash forecast or pipeline quality, and most decisions sit with me.",
  "situationClarifiers": [
    "Cash feels tight or unpredictable",
    "Costs are rising faster than revenue",
    "Too many decisions depend on me"
  ],
  "decisionHorizon": "Within 90 days",
  "clarityLevel": "I see trade-offs but struggle to choose",
  "dataAvailable": [
    "Financial numbers (revenue, costs, cash)",
    "Customer or market data"
  ],
  "riskLevel": "Cash stress"
}
```

### Synthesis summary

- **Primary domain:** cfo
- **Emerging decision:** The SME is a seed-stage B2B SaaS company with a healthy growth rate but volatile cash flows. There is a strong need for better cash flow visibility and management.

### Decision snapshot

- **decision_statement:** for a startup company in b2b saas – workflow automation, The SME is a seed-stage B2B SaaS company with a healthy growth rate but volatile cash flows. There is a strong need for better cash flow visibility and management.
- **why_now:**
  ```json
  [
  "Cash flow management and forecast reliability",
  "Volatile revenue streams",
  "Lack of robust financial systems",
  "Limited visibility into unit economics"
]
  ```
- **key_constraints:**
  ```json
  [
  "Resource and time constraints typical of SMEs."
]
  ```
- **options:**
  ```json
  [
  {
    "id": "opt1",
    "title": "Primary path",
    "summary": "The SME is a seed-stage B2B SaaS company with a healthy growth rate but volatile cash flows. There is a strong need for better cash flow visibility and management.",
    "pros_cons": {}
  },
  {
    "id": "opt2",
    "title": "Alternative",
    "summary": "Implement a robust cash flow forecasting tool",
    "pros_cons": {}
  }
]
  ```
- **recommended_path:** The SME is a seed-stage B2B SaaS company with a healthy growth rate but volatile cash flows. There is a strong need for better cash flow visibility and management.
- **first_actions:**
  ```json
  [
  "Research and trial a cash flow management tool suitable for SMEs",
  "Begin financial management training or start the hiring process for a financial resource",
  "Continue with the financial training or onboard the new hire"
]
  ```
- **risks:**
  ```json
  [
  "Volatile revenue streams",
  "Lack of robust financial systems",
  "Limited visibility into unit economics"
]
  ```
- **success_metric:** Improved clarity and first steps completed within 90 days.
- **timeframe:** 90 days

### Governance

- **decision_type:** finance
- **risk_tier:** medium
- **approval_status:** pending_approval
- **required_approvers:** ['board_or_lead']

### EMR

**Milestones:**
- Week 1 | owner: None | due: None | status: pending
- Month 1 | owner: None | due: None | status: pending
- Month 2 | owner: None | due: None | status: pending
- Quarter 1 | owner: None | due: None | status: pending
- Quarter 2 | owner: None | due: None | status: pending

**Metrics:**
- Primary outcome | target: Improved clarity and first steps completed within 90 days. text | actual: None | source: manual
- Timeframe | target: 90 days text | actual: None | source: manual

**Config:** cadence=monthly, next_review_date=2026-03-12

### Readiness

- **Band:** Nascent
- **Metrics:** {
  "number_of_reviews": 0,
  "milestone_completion_rate": 0.0,
  "total_milestones": 5,
  "completed_milestones": 0,
  "governance_adherence": 0.0
}

### Chat seed (initial assistant message)

Hello Aisha, I understand you're looking to improve cash flow visibility and management for your seed-stage B2B SaaS company in workflow automation. What's the biggest challenge you're currently facing in achieving this?


---


## Test 2 – Series A marketplace, unit economics & churn

**Decision ID:** `917ee9a5-c840-43b0-a145-c54f878d3f60`

### Inputs

**Onboarding:**
```json
{
  "name": "Daniel",
  "country": "Indonesia",
  "industry": "B2C marketplace \u2013 home services",
  "company_size": "41\u201350",
  "email": "daniel@homesquad.id"
}
```

**Wizard (diagnostic_data):**
```json
{
  "businessStage": "Growing but unstable",
  "situationDescription": "Our marketplace GMV is growing fast but we're losing money on each order once we include subsidies, marketing and support. Repeat usage is low and partner churn is increasing. I need to decide how aggressively to cut subsidies and performance marketing while improving retention and partner economics, without killing top-line growth.",
  "situationClarifiers": [
    "Sales are declining or unstable",
    "Costs are rising faster than revenue",
    "Operations feel messy or fragile"
  ],
  "decisionHorizon": "Within 6 months",
  "clarityLevel": "I have options but need structure to decide",
  "dataAvailable": [
    "Financial numbers (revenue, costs, cash)",
    "Operational metrics (throughput, quality)",
    "Customer or market data"
  ],
  "riskLevel": "Business viability risk"
}
```

### Synthesis summary

- **Primary domain:** coo
- **Emerging decision:** The marketplace is expanding rapidly but each order leads to financial losses. With low repeat usage and increasing partner churn, efficiency and sustainability are main concerns.

### Decision snapshot

- **decision_statement:** for a startup company in b2c marketplace – home services, The marketplace is expanding rapidly but each order leads to financial losses. With low repeat usage and increasing partner churn, efficiency and sustainability are main concerns.
- **why_now:**
  ```json
  [
  "Economic losses on each order due to subsidies, marketing, and support costs, coupled with low repeat usage and partner churn.",
  "Increasing cost overruns due to inefficient order economics",
  "High partner churn rate",
  "Negative impact on top-line growth with any reduction of subsidies and performance marketing"
]
  ```
- **key_constraints:**
  ```json
  [
  "Resource and time constraints typical of SMEs."
]
  ```
- **options:**
  ```json
  [
  {
    "id": "opt1",
    "title": "Primary path",
    "summary": "The marketplace is expanding rapidly but each order leads to financial losses. With low repeat usage and increasing partner churn, efficiency and sustainability are main concerns.",
    "pros_cons": {}
  },
  {
    "id": "opt2",
    "title": "Alternative",
    "summary": "Reevaluate and optimize the economic balance of subsidies, marketing, and support costs",
    "pros_cons": {}
  }
]
  ```
- **recommended_path:** The marketplace is expanding rapidly but each order leads to financial losses. With low repeat usage and increasing partner churn, efficiency and sustainability are main concerns.
- **first_actions:**
  ```json
  [
  "Start budgeting review to reconsider subsidies and marketing costs",
  "Plan a partner meeting to understand reasons behind churn and devise potential retention solutions",
  "Reduce, optimize, or redistribute subsidies based on budgeting review output and feedback",
  "Review effectiveness of updated subsidy and marketing costs through KPI tracking"
]
  ```
- **risks:**
  ```json
  [
  "Increasing cost overruns due to inefficient order economics",
  "High partner churn rate",
  "Negative impact on top-line growth with any reduction of subsidies and performance marketing"
]
  ```
- **success_metric:** Improved clarity and first steps completed within 90 days.
- **timeframe:** 90 days

### Governance

- **decision_type:** ops
- **risk_tier:** high
- **approval_status:** pending_approval
- **required_approvers:** ['board_or_lead']

### EMR

**Milestones:**
- Week 1 | owner: None | due: None | status: pending
- Week 2 | owner: None | due: None | status: pending
- Week 3 | owner: None | due: None | status: pending
- Month 1 | owner: None | due: None | status: pending
- Month 2 | owner: None | due: None | status: pending

**Metrics:**
- Primary outcome | target: Improved clarity and first steps completed within 90 days. text | actual: None | source: manual
- Timeframe | target: 90 days text | actual: None | source: manual

**Config:** cadence=monthly, next_review_date=2026-03-12

### Readiness

- **Band:** Nascent
- **Metrics:** {
  "number_of_reviews": 0,
  "milestone_completion_rate": 0.0,
  "total_milestones": 5,
  "completed_milestones": 0,
  "governance_adherence": 0.0
}

### Chat seed (initial assistant message)

Hello Daniel, 
I understand you're deciding how to improve efficiency and sustainability for your rapidly expanding B2C home services marketplace, despite financial losses per order and low repeat usage. What specific measures have you considered to reduce partner churn and increase repeat usage?


---


## Test 3 – MSME manufacturer, inventory & ops chaos

**Decision ID:** `6aa4f606-9a22-4097-8b63-80e2309fc1b9`

### Inputs

**Onboarding:**
```json
{
  "name": "Nur",
  "country": "Malaysia",
  "industry": "Manufacturing \u2013 packaged food",
  "company_size": "11\u201320",
  "email": "nur@halalsnacks.my"
}
```

**Wizard (diagnostic_data):**
```json
{
  "businessStage": "Stable but stretched",
  "situationDescription": "We manufacture halal snacks sold to mini markets and online. Demand is good but we constantly run out of some SKUs and overstock others. Cash is stuck in slow-moving inventory, we guess production based on what feels urgent, and I'm not sure which operational changes to prioritize to stabilise stock and cash.",
  "situationClarifiers": [
    "Cash feels tight or unpredictable",
    "Operations feel messy or fragile"
  ],
  "decisionHorizon": "Within 90 days",
  "clarityLevel": "I see trade-offs but struggle to choose",
  "dataAvailable": [
    "Financial numbers (revenue, costs, cash)",
    "Operational metrics (throughput, quality)",
    "Little formal data"
  ],
  "riskLevel": "Slower growth"
}
```

### Synthesis summary

- **Primary domain:** cfo
- **Emerging decision:** The SME is a halal snack manufacturer with a good demand but struggles with cash flow management due to inventory issues. There is no visibility of financial health due to the absence of formal financial statements and inconsistent inventory management.

### Decision snapshot

- **decision_statement:** for a startup company in manufacturing – packaged food, The SME is a halal snack manufacturer with a good demand but struggles with cash flow management due to inventory issues. There is no visibility of financial health due to the absence of formal financial statements and inconsistent inventory management.
- **why_now:**
  ```json
  [
  "Poor cash flow and inventory management.",
  "Overstocking and lack of inventory rotation leading to cash tied up in slow-moving inventory.",
  "Lack of formal financial statements resulting in limited visibility into the company's financial status.",
  "Over-reliance on personal intuition rather than data for production decisions."
]
  ```
- **key_constraints:**
  ```json
  [
  "Resource and time constraints typical of SMEs."
]
  ```
- **options:**
  ```json
  [
  {
    "id": "opt1",
    "title": "Primary path",
    "summary": "The SME is a halal snack manufacturer with a good demand but struggles with cash flow management due to inventory issues. There is no visibility of financial health due to the absence of formal financ",
    "pros_cons": {}
  },
  {
    "id": "opt2",
    "title": "Alternative",
    "summary": "Implement an inventory management system to reduce overstocking and ensure better cash flow.",
    "pros_cons": {}
  }
]
  ```
- **recommended_path:** The SME is a halal snack manufacturer with a good demand but struggles with cash flow management due to inventory issues. There is no visibility of financial health due to the absence of formal financial statements and inconsistent inventory management.
- **first_actions:**
  ```json
  [
  "Identify potential inventory management systems suitable for the business size and needs.",
  "Implement the chosen inventory management system.",
  "Review inventory management system effectiveness and adjust as necessary."
]
  ```
- **risks:**
  ```json
  [
  "Overstocking and lack of inventory rotation leading to cash tied up in slow-moving inventory.",
  "Lack of formal financial statements resulting in limited visibility into the company's financial status.",
  "Over-reliance on personal intuition rather than data for production decisions."
]
  ```
- **success_metric:** Improved clarity and first steps completed within 90 days.
- **timeframe:** 90 days

### Governance

- **decision_type:** finance
- **risk_tier:** high
- **approval_status:** pending_approval
- **required_approvers:** ['board_or_lead']

### EMR

**Milestones:**
- Week 1 | owner: None | due: None | status: pending
- Month 1 | owner: None | due: None | status: pending
- Month 2 | owner: None | due: None | status: pending
- Quarter 1 | owner: None | due: None | status: pending
- Quarter 2 | owner: None | due: None | status: pending

**Metrics:**
- Primary outcome | target: Improved clarity and first steps completed within 90 days. text | actual: None | source: manual
- Timeframe | target: 90 days text | actual: None | source: manual

**Config:** cadence=monthly, next_review_date=2026-03-12

### Readiness

- **Band:** Nascent
- **Metrics:** {
  "number_of_reviews": 0,
  "milestone_completion_rate": 0.0,
  "total_milestones": 5,
  "completed_milestones": 0,
  "governance_adherence": 0.0
}

### Chat seed (initial assistant message)

Hello Nur, 

I understand that you're looking to improve cash flow management for your halal snack manufacturing startup, which is currently struggling due to inventory issues and lack of financial visibility. What's the first step you've considered to formalize your financial statements and improve inventory management?


---


## Test 4 – Infra fintech, unclear GTM & ICP

**Decision ID:** `8b4f412b-2660-40dc-bb84-b256d4ca42e7`

### Inputs

**Onboarding:**
```json
{
  "name": "Kofi",
  "country": "Ghana",
  "industry": "Fintech infrastructure \u2013 payments API",
  "company_size": "21\u201350",
  "email": "kofi@transitpay.africa"
}
```

**Wizard (diagnostic_data):**
```json
{
  "businessStage": "Early but operating",
  "situationDescription": "We built a reliable cross-border payments API and have a few pilots, but sales cycles are slow and we're chasing many different types of customers (fintechs, marketplaces, remittance apps) without a clear ICP. We need to decide our GTM focus segment and motion so we can reach meaningful revenue before runway becomes a serious issue.",
  "situationClarifiers": [
    "Sales are declining or unstable",
    "Too many decisions depend on me",
    "I'm not sure \u2014 it's complicated"
  ],
  "decisionHorizon": "Within 6 months",
  "clarityLevel": "I have options but need structure to decide",
  "dataAvailable": [
    "Customer or market data",
    "Little formal data"
  ],
  "riskLevel": "Slower growth"
}
```

### Synthesis summary

- **Primary domain:** cfo
- **Emerging decision:** The SME is in a dormant financial state with no revenue or expenses reported. The primary challenge is in managing cash flow, likely due to a lack of revenue from slow sales cycles and an unclear go-to-market strategy.

### Decision snapshot

- **decision_statement:** for a startup company in fintech infrastructure – payments api, The SME is in a dormant financial state with no revenue or expenses reported. The primary challenge is in managing cash flow, likely due to a lack of revenue from slow sales cycles and an unclear go-to-market strategy.
- **why_now:**
  ```json
  [
  "Lack of clear go-to-market strategy and slow sales cycles resulting in no revenue.",
  "Lack of clear business strategy",
  "Slow sales cycles",
  "No revenue"
]
  ```
- **key_constraints:**
  ```json
  [
  "Resource and time constraints typical of SMEs."
]
  ```
- **options:**
  ```json
  [
  {
    "id": "opt1",
    "title": "Primary path",
    "summary": "The SME is in a dormant financial state with no revenue or expenses reported. The primary challenge is in managing cash flow, likely due to a lack of revenue from slow sales cycles and an unclear go-t",
    "pros_cons": {}
  },
  {
    "id": "opt2",
    "title": "Alternative",
    "summary": "Define a clear go-to-market strategy focusing on a specific customer segment",
    "pros_cons": {}
  }
]
  ```
- **recommended_path:** The SME is in a dormant financial state with no revenue or expenses reported. The primary challenge is in managing cash flow, likely due to a lack of revenue from slow sales cycles and an unclear go-to-market strategy.
- **first_actions:**
  ```json
  [
  "Start defining a go-to-market strategy focusing on the most promising customer segment",
  "Begin implementing the go-to-market strategy and invest in targeted sales and marketing efforts",
  "Review financial health and consider seeking external funding or partnerships if revenues remain stagnant"
]
  ```
- **risks:**
  ```json
  [
  "Lack of clear business strategy",
  "Slow sales cycles",
  "No revenue"
]
  ```
- **success_metric:** Improved clarity and first steps completed within 90 days.
- **timeframe:** 90 days

### Governance

- **decision_type:** finance
- **risk_tier:** high
- **approval_status:** pending_approval
- **required_approvers:** ['board_or_lead']

### EMR

**Milestones:**
- Week 1 | owner: None | due: None | status: pending
- Month 1 | owner: None | due: None | status: pending
- Quarter 1 | owner: None | due: None | status: pending

**Metrics:**
- Primary outcome | target: Improved clarity and first steps completed within 90 days. text | actual: None | source: manual
- Timeframe | target: 90 days text | actual: None | source: manual

**Config:** cadence=monthly, next_review_date=2026-03-12

### Readiness

- **Band:** Nascent
- **Metrics:** {
  "number_of_reviews": 0,
  "milestone_completion_rate": 0.0,
  "total_milestones": 3,
  "completed_milestones": 0,
  "governance_adherence": 0.0
}

### Chat seed (initial assistant message)

Hello Kofi, 

I understand that you're trying to manage cash flow for your fintech infrastructure startup, particularly given the slow sales cycles and unclear go-to-market strategy. What immediate steps are you considering to increase your revenue?


---


## Test 5 – Series B SaaS, org focus & execution rhythm

**Decision ID:** `a466a08c-4031-4826-86e2-6850328bc588`

### Inputs

**Onboarding:**
```json
{
  "name": "Maya",
  "country": "Singapore",
  "industry": "B2B SaaS \u2013 analytics",
  "company_size": "101\u2013250",
  "email": "maya@insightloop.com"
}
```

**Wizard (diagnostic_data):**
```json
{
  "businessStage": "Established, seeking resilience",
  "situationDescription": "We've grown to about USD 12M ARR but execution feels messy. We have too many priorities, roadmaps keep shifting, OKRs are fuzzy, and critical initiatives slip without a clear review cadence. I need to decide how to refocus the company on a few big bets and build a consistent execution rhythm so we don't lose momentum at this stage.",
  "situationClarifiers": [
    "Too many decisions depend on me",
    "Operations feel messy or fragile"
  ],
  "decisionHorizon": "No fixed timeline, but it's weighing on us",
  "clarityLevel": "I see trade-offs but struggle to choose",
  "dataAvailable": [
    "Operational metrics (throughput, quality)",
    "Little formal data"
  ],
  "riskLevel": "Slower growth"
}
```

### Synthesis summary

- **Primary domain:** cfo
- **Emerging decision:** Despite achieving a substantial annual recurring revenue (ARR), the company is facing significant challenges in managing its cash flow and prioritizing its operations. The absence of formal financial statements and reliance on basic tools like spreadsheets might be contributing to the perceived messiness in execution.

### Decision snapshot

- **decision_statement:** for a startup company in b2b saas – analytics, Despite achieving a substantial annual recurring revenue (ARR), the company is facing significant challenges in managing its cash flow and prioritizing its operations. The absence of formal financial statements and reliance on basic tools like spreadsheets might be contributing to the perceived messiness in execution.
- **why_now:**
  ```json
  [
  "Lack of clarity in cash flow management and operational prioritization",
  "Inability to manage cash flow and prioritize operations effectively",
  "Risk of losing momentum due to unclear roadmaps and shifting priorities",
  "Lack of formal financial statements and reliance on basic tools for financial management"
]
  ```
- **key_constraints:**
  ```json
  [
  "Resource and time constraints typical of SMEs."
]
  ```
- **options:**
  ```json
  [
  {
    "id": "opt1",
    "title": "Primary path",
    "summary": "Despite achieving a substantial annual recurring revenue (ARR), the company is facing significant challenges in managing its cash flow and prioritizing its operations. The absence of formal financial ",
    "pros_cons": {}
  },
  {
    "id": "opt2",
    "title": "Alternative",
    "summary": "Implement a more robust financial management system to gain better visibility into cash flow",
    "pros_cons": {}
  }
]
  ```
- **recommended_path:** Despite achieving a substantial annual recurring revenue (ARR), the company is facing significant challenges in managing its cash flow and prioritizing its operations. The absence of formal financial statements and reliance on basic tools like spreadsheets might be contributing to the perceived messiness in execution.
- **first_actions:**
  ```json
  [
  "Review current cash flow management practices and identify key areas of improvement",
  "Implement a robust financial management system and establish a clear operational roadmap",
  "Hire a financial advisor to optimize cash flow management and streamline financial operations"
]
  ```
- **risks:**
  ```json
  [
  "Inability to manage cash flow and prioritize operations effectively",
  "Risk of losing momentum due to unclear roadmaps and shifting priorities",
  "Lack of formal financial statements and reliance on basic tools for financial management"
]
  ```
- **success_metric:** Improved clarity and first steps completed within 90 days.
- **timeframe:** 90 days

### Governance

- **decision_type:** finance
- **risk_tier:** medium
- **approval_status:** pending_approval
- **required_approvers:** ['board_or_lead']

### EMR

**Milestones:**
- Week 1 | owner: None | due: None | status: pending
- Month 1 | owner: None | due: None | status: pending
- Quarter 1 | owner: None | due: None | status: pending

**Metrics:**
- Primary outcome | target: Improved clarity and first steps completed within 90 days. text | actual: None | source: manual
- Timeframe | target: 90 days text | actual: None | source: manual

**Config:** cadence=monthly, next_review_date=2026-03-12

### Readiness

- **Band:** Nascent
- **Metrics:** {
  "number_of_reviews": 0,
  "milestone_completion_rate": 0.0,
  "total_milestones": 3,
  "completed_milestones": 0,
  "governance_adherence": 0.0
}

### Chat seed (initial assistant message)

Hi Maya, I understand you're trying to manage cash flow and prioritize operations for your B2B SaaS startup, despite having substantial ARR. What financial management tools or systems have you considered to replace your current spreadsheet method?


---

