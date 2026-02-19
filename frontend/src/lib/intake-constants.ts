/**
 * Constants for conversational intake: countries, sectors, org size, role labels.
 */

import type { ImpactCategoryId, InvestorThemeId, MetricFocusArea, Role } from "./intake-types";

/** Full list of countries (ISO 3166-1 alpha-2), alphabetically sorted by label. Used in StepIdentity and StepInvestorProfile. */
export const INTAKE_COUNTRIES: { value: string; label: string }[] = [
  { value: "AF", label: "Afghanistan" },
  { value: "AL", label: "Albania" },
  { value: "DZ", label: "Algeria" },
  { value: "AD", label: "Andorra" },
  { value: "AO", label: "Angola" },
  { value: "AG", label: "Antigua and Barbuda" },
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaijan" },
  { value: "BS", label: "Bahamas" },
  { value: "BH", label: "Bahrain" },
  { value: "BD", label: "Bangladesh" },
  { value: "BB", label: "Barbados" },
  { value: "BY", label: "Belarus" },
  { value: "BE", label: "Belgium" },
  { value: "BZ", label: "Belize" },
  { value: "BJ", label: "Benin" },
  { value: "BT", label: "Bhutan" },
  { value: "BO", label: "Bolivia" },
  { value: "BA", label: "Bosnia and Herzegovina" },
  { value: "BW", label: "Botswana" },
  { value: "BR", label: "Brazil" },
  { value: "BN", label: "Brunei Darussalam" },
  { value: "BG", label: "Bulgaria" },
  { value: "BF", label: "Burkina Faso" },
  { value: "BI", label: "Burundi" },
  { value: "KH", label: "Cambodia" },
  { value: "CM", label: "Cameroon" },
  { value: "CA", label: "Canada" },
  { value: "CV", label: "Cabo Verde" },
  { value: "CF", label: "Central African Republic" },
  { value: "TD", label: "Chad" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CO", label: "Colombia" },
  { value: "KM", label: "Comoros" },
  { value: "CG", label: "Congo" },
  { value: "CD", label: "Congo, Democratic Republic of the" },
  { value: "CR", label: "Costa Rica" },
  { value: "CI", label: "Côte d'Ivoire" },
  { value: "HR", label: "Croatia" },
  { value: "CU", label: "Cuba" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czechia" },
  { value: "DK", label: "Denmark" },
  { value: "DJ", label: "Djibouti" },
  { value: "DM", label: "Dominica" },
  { value: "DO", label: "Dominican Republic" },
  { value: "EC", label: "Ecuador" },
  { value: "EG", label: "Egypt" },
  { value: "SV", label: "El Salvador" },
  { value: "GQ", label: "Equatorial Guinea" },
  { value: "ER", label: "Eritrea" },
  { value: "EE", label: "Estonia" },
  { value: "SZ", label: "Eswatini" },
  { value: "ET", label: "Ethiopia" },
  { value: "FJ", label: "Fiji" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "GA", label: "Gabon" },
  { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "GR", label: "Greece" },
  { value: "GD", label: "Grenada" },
  { value: "GT", label: "Guatemala" },
  { value: "GN", label: "Guinea" },
  { value: "GW", label: "Guinea-Bissau" },
  { value: "GY", label: "Guyana" },
  { value: "HT", label: "Haiti" },
  { value: "HN", label: "Honduras" },
  { value: "HK", label: "Hong Kong" },
  { value: "HU", label: "Hungary" },
  { value: "IS", label: "Iceland" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IR", label: "Iran, Islamic Republic of" },
  { value: "IQ", label: "Iraq" },
  { value: "IE", label: "Ireland" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "JM", label: "Jamaica" },
  { value: "JP", label: "Japan" },
  { value: "JO", label: "Jordan" },
  { value: "KZ", label: "Kazakhstan" },
  { value: "KE", label: "Kenya" },
  { value: "KI", label: "Kiribati" },
  { value: "KP", label: "Korea, Democratic People's Republic of" },
  { value: "KR", label: "Korea, Republic of" },
  { value: "KW", label: "Kuwait" },
  { value: "KG", label: "Kyrgyzstan" },
  { value: "LA", label: "Lao People's Democratic Republic" },
  { value: "LV", label: "Latvia" },
  { value: "LB", label: "Lebanon" },
  { value: "LS", label: "Lesotho" },
  { value: "LR", label: "Liberia" },
  { value: "LY", label: "Libya" },
  { value: "LI", label: "Liechtenstein" },
  { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" },
  { value: "MO", label: "Macao" },
  { value: "MG", label: "Madagascar" },
  { value: "MW", label: "Malawi" },
  { value: "MY", label: "Malaysia" },
  { value: "MV", label: "Maldives" },
  { value: "ML", label: "Mali" },
  { value: "MT", label: "Malta" },
  { value: "MH", label: "Marshall Islands" },
  { value: "MR", label: "Mauritania" },
  { value: "MU", label: "Mauritius" },
  { value: "MX", label: "Mexico" },
  { value: "FM", label: "Micronesia, Federated States of" },
  { value: "MD", label: "Moldova, Republic of" },
  { value: "MC", label: "Monaco" },
  { value: "MN", label: "Mongolia" },
  { value: "ME", label: "Montenegro" },
  { value: "MA", label: "Morocco" },
  { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar" },
  { value: "NA", label: "Namibia" },
  { value: "NR", label: "Nauru" },
  { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands, Kingdom of the" },
  { value: "NZ", label: "New Zealand" },
  { value: "NI", label: "Nicaragua" },
  { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" },
  { value: "MK", label: "North Macedonia" },
  { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" },
  { value: "PK", label: "Pakistan" },
  { value: "PW", label: "Palau" },
  { value: "PS", label: "Palestine, State of" },
  { value: "PA", label: "Panama" },
  { value: "PG", label: "Papua New Guinea" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "QA", label: "Qatar" },
  { value: "RO", label: "Romania" },
  { value: "RU", label: "Russian Federation" },
  { value: "RW", label: "Rwanda" },
  { value: "KN", label: "Saint Kitts and Nevis" },
  { value: "LC", label: "Saint Lucia" },
  { value: "VC", label: "Saint Vincent and the Grenadines" },
  { value: "WS", label: "Samoa" },
  { value: "SM", label: "San Marino" },
  { value: "ST", label: "Sao Tome and Principe" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "SN", label: "Senegal" },
  { value: "RS", label: "Serbia" },
  { value: "SC", label: "Seychelles" },
  { value: "SL", label: "Sierra Leone" },
  { value: "SG", label: "Singapore" },
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "SB", label: "Solomon Islands" },
  { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" },
  { value: "SS", label: "South Sudan" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "SD", label: "Sudan" },
  { value: "SR", label: "Suriname" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "SY", label: "Syrian Arab Republic" },
  { value: "TW", label: "Taiwan, Province of China" },
  { value: "TJ", label: "Tajikistan" },
  { value: "TZ", label: "Tanzania, United Republic of" },
  { value: "TH", label: "Thailand" },
  { value: "TL", label: "Timor-Leste" },
  { value: "TG", label: "Togo" },
  { value: "TO", label: "Tonga" },
  { value: "TT", label: "Trinidad and Tobago" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Türkiye" },
  { value: "TM", label: "Turkmenistan" },
  { value: "TV", label: "Tuvalu" },
  { value: "UG", label: "Uganda" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistan" },
  { value: "VU", label: "Vanuatu" },
  { value: "VE", label: "Venezuela, Bolivarian Republic of" },
  { value: "VN", label: "Viet Nam" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" },
  { value: "other", label: "Other" },
];

export const INTAKE_SECTORS: { value: string; label: string }[] = [
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "services", label: "Services" },
  { value: "tech", label: "Technology" },
  { value: "f&b", label: "Food & Beverage" },
  { value: "healthcare", label: "Healthcare" },
  { value: "other", label: "Other" },
];

export const ORG_SIZE_BANDS: { value: string; label: string }[] = [
  { value: "solo", label: "Just me" },
  { value: "2-10", label: "2–10" },
  { value: "11-50", label: "11–50" },
  { value: "51-200", label: "51–200" },
  { value: "200+", label: "200+" },
];

export const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  {
    value: "msme_owner",
    label: "MSME Owner / Operator",
    description: "Running an established small or medium business (retail, services, manufacturing, etc.).",
  },
  {
    value: "startup_founder",
    label: "Startup Founder",
    description: "Building a new venture (pre-seed to scale-up), often tech-enabled or high-growth.",
  },
  {
    value: "social_enterprise_leader",
    label: "Social Enterprise Leader",
    description: "Running a business or organization with a clear social or environmental mission that you report to funders or partners.",
  },
  {
    value: "aspiring_entrepreneur",
    label: "Aspiring Entrepreneur",
    description: "Idea or validation stage, not yet operating.",
  },
  {
    value: "impact_investor",
    label: "Impact Investor / Capital Partner",
    description: "Investors and funders seeking portfolio-level diagnostics, due diligence, and impact reporting.",
  },
];

/** Founder path: primary area affected. */
export const PRIMARY_AREA_OPTIONS = [
  { value: "finance", label: "Finance / cash" },
  { value: "operations", label: "Operations / process" },
  { value: "growth", label: "Growth / demand" },
  { value: "tech", label: "Technology / systems" },
  { value: "multiple", label: "Multiple / not sure" },
];

/** Founder path: business stage dropdown. */
export const BUSINESS_STAGE_OPTIONS = [
  { value: "pre_revenue", label: "Pre-revenue / validating" },
  { value: "early_revenue", label: "Early revenue (1–3 years)" },
  { value: "scaling", label: "Scaling (3–5 years)" },
  { value: "growth", label: "Growth (5+ years)" },
  { value: "other", label: "Other" },
];

/** Founder path: primary theme. */
export const PRIMARY_THEME_OPTIONS = [
  { value: "cash_flow", label: "Cash flow" },
  { value: "hiring", label: "Hiring / team" },
  { value: "fundraising", label: "Fundraising" },
  { value: "product_market", label: "Product-market fit" },
  { value: "supply_chain", label: "Supply chain" },
  { value: "other", label: "Other" },
];

/** Founder path: most urgent. */
export const MOST_URGENT_OPTIONS = [
  { value: "survive_cash", label: "Cash / runway" },
  { value: "fix_ops", label: "Operations / process" },
  { value: "grow_demand", label: "Growth / demand" },
  { value: "tech", label: "Technology / systems" },
];

/** Founder path: diagnostic goal. */
export const DIAGNOSTIC_GOAL_OPTIONS = [
  { value: "improve_cash_flow", label: "Improve cash flow" },
  { value: "scale_operations", label: "Scale operations" },
  { value: "investor_ready", label: "Get investor ready" },
  { value: "", label: "Just clarify and plan" },
];

/** Founder path: decision horizon. */
export const DECISION_HORIZON_OPTIONS = [
  { value: "1_month", label: "1 month" },
  { value: "3_months", label: "3 months" },
  { value: "6_months", label: "6 months" },
  { value: "12_months", label: "12 months" },
  { value: "other", label: "Other" },
];

/** MSME path: challenge options (value matches legacy). */
export const MSME_CHALLENGE_OPTIONS = [
  { value: "cash_tight", label: "Cash feels tight or unpredictable" },
  { value: "customers_late", label: "Customers are paying late or not paying" },
  { value: "sales_declining", label: "Sales are declining or unstable" },
  { value: "costs_rising", label: "Costs are rising faster than revenue" },
  { value: "decisions_on_me", label: "Too many decisions depend on me" },
  { value: "ops_messy", label: "Operations feel messy or fragile" },
  { value: "not_sure", label: "I'm not sure; it's complicated" },
];

/** MSME path: primary focus. */
export const MSME_PRIMARY_FOCUS_OPTIONS = [
  { value: "cfo", label: "Finance / cash" },
  { value: "cmo", label: "Growth / marketing" },
  { value: "coo", label: "Operations" },
  { value: "cto", label: "Technology" },
];

/** MSME path: how long have you been operating (business context). */
export const MSME_YEARS_OPERATING_OPTIONS = [
  { value: "<1", label: "Less than 1 year" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5+", label: "5+ years" },
];

/** MSME path: single biggest constraint right now. */
export const MSME_PRIMARY_CONSTRAINT_OPTIONS = [
  { value: "time", label: "Time" },
  { value: "cash", label: "Cash" },
  { value: "people", label: "People" },
  { value: "market", label: "Market" },
];

/** MSME path: demand for product or service right now. */
export const MSME_DEMAND_SENTIMENT_OPTIONS = [
  { value: "stable", label: "Stable" },
  { value: "growing", label: "Growing" },
  { value: "declining", label: "Declining" },
  { value: "unpredictable", label: "Unpredictable" },
];

/** MSME path: when do you need to see results (aligned with founder horizon). */
export const MSME_DECISION_HORIZON_OPTIONS = [
  { value: "1_month", label: "1 month" },
  { value: "3_months", label: "3 months" },
  { value: "6_months", label: "6 months" },
  { value: "12_months", label: "12 months" },
  { value: "other", label: "Other" },
];

/** 8 Universal Impact Categories (social enterprise add-on). */
export const IMPACT_CATEGORIES: { value: ImpactCategoryId; label: string }[] = [
  { value: "livelihoods_income", label: "Livelihoods & Income" },
  { value: "education_skills", label: "Education & Skills" },
  { value: "health_wellbeing", label: "Health & Wellbeing" },
  { value: "environment_climate", label: "Environment & Climate" },
  { value: "financial_inclusion", label: "Financial Inclusion" },
  { value: "gender_inclusion", label: "Gender & Inclusion" },
  { value: "community_development", label: "Community Development" },
  { value: "governance_rights", label: "Governance & Rights" },
];

/** Metric focus areas (social enterprise). */
export const METRIC_FOCUS_AREAS: { value: MetricFocusArea; label: string }[] = [
  { value: "reach", label: "Reach (beneficiaries, geography)" },
  { value: "jobs_and_income", label: "Jobs & income" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "environment", label: "Environment" },
  { value: "financial_inclusion", label: "Financial inclusion" },
  { value: "gender_inclusion", label: "Gender & inclusion" },
];

/** Investor: regions (multi-select). Stable list for thesis capture. */
export const INTAKE_REGIONS: { value: string; label: string }[] = [
  { value: "Africa", label: "Africa" },
  { value: "Asia", label: "Asia" },
  { value: "MENA", label: "MENA" },
  { value: "Latin America", label: "Latin America" },
  { value: "Europe", label: "Europe" },
  { value: "North America", label: "North America" },
  { value: "Global", label: "Global" },
];

/** Investor: richer sector taxonomy (best-practice impact / venture). Multi-select; value stored in investor_profile.sectors. */
export const INVESTOR_SECTORS: { value: string; label: string }[] = [
  { value: "agriculture", label: "Agriculture & agribusiness" },
  { value: "clean_energy", label: "Clean energy & climate" },
  { value: "education", label: "Education" },
  { value: "financial_services", label: "Financial services & fintech" },
  { value: "healthcare", label: "Healthcare" },
  { value: "housing", label: "Housing & real estate" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "tech_digital", label: "Technology & digital" },
  { value: "water_sanitation", label: "Water & sanitation" },
  { value: "other", label: "Other" },
];

/** Investor: impact themes with SDG-style labels. id maps to ImpactCategoryId for storage and aggregation. */
export const INVESTOR_THEMES_EXPANDED: { value: ImpactCategoryId; label: string }[] = [
  { value: "livelihoods_income", label: "SDG 1 – No Poverty (Poverty reduction, Financial inclusion)" },
  { value: "education_skills", label: "SDG 4 – Quality Education (Education & Skills)" },
  { value: "health_wellbeing", label: "SDG 3 – Good Health (Health & Wellbeing)" },
  { value: "environment_climate", label: "SDG 13 – Climate Action (Environment & Climate)" },
  { value: "financial_inclusion", label: "SDG 10 – Reduced Inequalities (Financial inclusion)" },
  { value: "gender_inclusion", label: "SDG 5 – Gender Equality (Gender & Inclusion)" },
  { value: "community_development", label: "SDG 11 – Sustainable Communities (Community development)" },
  { value: "governance_rights", label: "SDG 16 – Peace & Institutions (Governance & Rights)" },
];

/** SDG 1–17 for Impact Investor: full list with title and short description. */
export interface InvestorSdgThemeEntry {
  id: InvestorThemeId;
  sdgNumber: number;
  title: string;
  shortLabel: string;
  description: string;
}

export const INVESTOR_SDG_THEMES: InvestorSdgThemeEntry[] = [
  { id: "sdg_1", sdgNumber: 1, title: "End poverty in all its forms everywhere", shortLabel: "No Poverty", description: "Poverty reduction, financial inclusion" },
  { id: "sdg_2", sdgNumber: 2, title: "End hunger, achieve food security and improved nutrition", shortLabel: "Zero Hunger", description: "Food security, agriculture" },
  { id: "sdg_3", sdgNumber: 3, title: "Ensure healthy lives and promote well-being for all", shortLabel: "Good Health and Well-Being", description: "Health, well-being" },
  { id: "sdg_4", sdgNumber: 4, title: "Ensure inclusive and equitable quality education", shortLabel: "Quality Education", description: "Education and skills" },
  { id: "sdg_5", sdgNumber: 5, title: "Achieve gender equality and empower all women and girls", shortLabel: "Gender Equality", description: "Gender and inclusion" },
  { id: "sdg_6", sdgNumber: 6, title: "Ensure availability and sustainable management of water and sanitation", shortLabel: "Clean Water and Sanitation", description: "Water, sanitation" },
  { id: "sdg_7", sdgNumber: 7, title: "Ensure access to affordable, reliable, sustainable and modern energy", shortLabel: "Affordable and Clean Energy", description: "Clean energy, climate" },
  { id: "sdg_8", sdgNumber: 8, title: "Promote sustained, inclusive and sustainable economic growth", shortLabel: "Decent Work and Economic Growth", description: "Jobs, livelihoods, income" },
  { id: "sdg_9", sdgNumber: 9, title: "Build resilient infrastructure, promote inclusive industrialization", shortLabel: "Industry, Innovation and Infrastructure", description: "Infrastructure, innovation" },
  { id: "sdg_10", sdgNumber: 10, title: "Reduce inequality within and among countries", shortLabel: "Reduced Inequalities", description: "Financial inclusion, equality" },
  { id: "sdg_11", sdgNumber: 11, title: "Make cities and human settlements inclusive, safe, resilient and sustainable", shortLabel: "Sustainable Cities and Communities", description: "Community development" },
  { id: "sdg_12", sdgNumber: 12, title: "Ensure sustainable consumption and production patterns", shortLabel: "Responsible Consumption and Production", description: "Environment, sustainability" },
  { id: "sdg_13", sdgNumber: 13, title: "Take urgent action to combat climate change and its impacts", shortLabel: "Climate Action", description: "Environment and climate" },
  { id: "sdg_14", sdgNumber: 14, title: "Conserve and sustainably use the oceans, seas and marine resources", shortLabel: "Life Below Water", description: "Oceans, marine" },
  { id: "sdg_15", sdgNumber: 15, title: "Protect, restore and promote sustainable use of terrestrial ecosystems", shortLabel: "Life on Land", description: "Biodiversity, land" },
  { id: "sdg_16", sdgNumber: 16, title: "Promote peaceful and inclusive societies, provide access to justice for all", shortLabel: "Peace, Justice and Strong Institutions", description: "Governance and rights" },
  { id: "sdg_17", sdgNumber: 17, title: "Strengthen the means of implementation and revitalize the global partnership", shortLabel: "Partnerships for the Goals", description: "Partnerships, governance" },
];

/** Map each SDG to one or more internal ImpactCategoryIds for aggregation. */
export const SDG_TO_IMPACT_CATEGORY: Record<InvestorThemeId, ImpactCategoryId[]> = {
  sdg_1: ["livelihoods_income", "financial_inclusion"],
  sdg_2: ["livelihoods_income"],
  sdg_3: ["health_wellbeing"],
  sdg_4: ["education_skills"],
  sdg_5: ["gender_inclusion"],
  sdg_6: ["environment_climate", "community_development"],
  sdg_7: ["environment_climate", "livelihoods_income"],
  sdg_8: ["livelihoods_income"],
  sdg_9: ["community_development", "livelihoods_income"],
  sdg_10: ["financial_inclusion", "gender_inclusion"],
  sdg_11: ["community_development"],
  sdg_12: ["environment_climate"],
  sdg_13: ["environment_climate"],
  sdg_14: ["environment_climate"],
  sdg_15: ["environment_climate"],
  sdg_16: ["governance_rights"],
  sdg_17: ["governance_rights", "community_development"],
};

/** Derive ImpactCategoryId[] from selected SDG theme ids (flatten + dedupe). */
export function sdgThemesToImpactCategories(sdgThemes: InvestorThemeId[]): ImpactCategoryId[] {
  const set = new Set<ImpactCategoryId>();
  for (const id of sdgThemes) {
    const cats = SDG_TO_IMPACT_CATEGORY[id];
    if (cats) for (const c of cats) set.add(c);
  }
  return Array.from(set);
}

/** Investor: portfolio stage. */
export const PORTFOLIO_STAGE_OPTIONS = [
  { value: "evaluating_opportunities", label: "Evaluating opportunities" },
  { value: "active_portfolio", label: "Active portfolio" },
  { value: "reporting_phase", label: "Reporting phase" },
  { value: "mixed", label: "Mixed" },
];

/** Investor: primary needs from CLEAR. */
export const INVESTOR_NEED_OPTIONS = [
  { value: "due_diligence_support", label: "Due diligence support" },
  { value: "portfolio_monitoring", label: "Portfolio monitoring" },
  { value: "impact_measurement_and_reporting", label: "Impact measurement & reporting" },
  { value: "exit_and_realization_planning", label: "Exit & realization planning" },
];
