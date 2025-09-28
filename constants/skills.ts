
import type { JobDomain } from '../types';

export const STOPWORDS = new Set(["and","or","the","a","an","to","for","of","in","on","with","by","from",
    "as","is","are","be","that","this","we","our","you","your","at","it",
    "using","use","used","will","can","ability","including","was","were","been",
    "have","has","had","do","does","did","would","could","should","may","might",
    "shall","must","need","want","like","get","got","go","went","come","came"]);

export const SKILL_DOMAINS: Record<JobDomain, string[]> = {
  DATA_ANALYSIS: [
    "python", "r", "sql", "matlab", "vba", "scala", "java", "javascript",
    "numpy", "pandas", "scipy", "dplyr", "data analysis", "data cleaning", "data wrangling",
    "etl", "data preprocessing", "feature engineering", "data modeling", "data pipelines",
    "data mining", "web scraping", "api development", "json", "xml", "csv handling",
    "scikit-learn", "tensorflow", "keras", "pytorch", "xgboost", "lightgbm", "catboost",
    "statsmodels", "jupyter", "matplotlib", "seaborn", "ggplot2", "plotly", "tableau", "power bi",
    "qlik", "looker", "dash", "data visualization", "dashboarding", "reporting", "business intelligence",
    "google data studio", "machine learning", "deep learning", "artificial intelligence", "predictive modeling",
    "classification", "regression", "clustering", "neural networks", "model evaluation", "model deployment",
    "mlops", "natural language processing", "nlp", "computer vision", "time series forecasting", "a/b testing",
    "sql server", "mysql", "postgresql", "oracle", "mongodb", "nosql", "hadoop", "spark", "pyspark",
    "hive", "kafka", "elasticsearch", "big data", "data engineering", "data warehousing", "data lakes",
    "snowflake", "redshift", "bigquery", "databricks"
  ],
  ECONOMICS_BUSINESS: [
    "financial modeling", "market research", "customer behavior analysis", "business analytics", "kpi monitoring",
    "economics", "microeconomics", "macroeconomics", "sales analytics", "marketing analytics", "pricing strategy",
    "competitive analysis", "product management", "operations management", "risk management", "risk analysis",
    "business strategy", "supply chain analytics", "inventory analysis", "sales forecasting", "financial analysis",
    "budgeting", "cost analysis", "profitability analysis", "revenue analysis", "trend analysis", "cohort analysis",
    "funnel analysis", "conversion analysis", "attribution modeling", "customer lifetime value", "market sizing",
    "demand forecasting", "inventory optimization", "crm tools", "salesforce", "hubspot", "google analytics",
    "google ads", "sem", "seo", "valuation models", "dcf", "discounted cash flow", "npv", "irr", "capm", "wacc",
    "financial ratios", "credit analysis", "portfolio optimization", "feasibility studies", "economic analysis",
    "cost-benefit analysis", "business case development", "swot analysis", "pestle analysis", "porter's five forces",
    "business model canvas", "go-to-market strategy", "agile methodology", "scrum", "six sigma", "lean manufacturing"
  ],
  HUMAN_RESOURCES: [
    "human resources", "hris", "applicant tracking system", "ats", "recruitment", "sourcing", "onboarding",
    "employee relations", "performance management", "talent management", "succession planning", "employee engagement",
    "compensation and benefits", "payroll", "hr policies", "labor law", "compliance", "organizational development",
    "workforce planning", "hr analytics", "people analytics", "training and development", "l&d", "change management",
    "conflict resolution", "diversity and inclusion", "d&i", "benefits administration", "job evaluation"
  ],
  POLITICS_PUBLIC_RELATIONS: [
    "public relations", "pr", "media relations", "crisis communication", "corporate communications", "press release",
    "public speaking", "copywriting", "social media management", "brand management", "reputation management",
    "stakeholder relations", "investor relations", "government relations", "public affairs", "lobbying",
    "policy analysis", "political science", "international relations", "legislative analysis", "campaign management",
    "speech writing", "advocacy", "community outreach", "event management"
  ],
  STATISTICS: [
    "statistics", "probability", "linear algebra", "calculus", "bayesian statistics", "hypothesis testing",
    "statistical modeling", "time series analysis", "econometrics", "quantitative analysis", "optimization",
    "regression analysis", "anova", "chi-square", "t-test", "confidence intervals", "p-values",
    "statistical significance", "experimental design", "sampling methods", "monte carlo simulation", "survival analysis",
    "multivariate analysis", "spss", "stata", "sas"
  ],
  GENERAL_TECH: [
    "git", "github", "gitlab", "docker", "kubernetes", "aws", "azure", "gcp", "cloud computing",
    "serverless", "microservices", "ci/cd", "devops", "automation", "api integration", "excel",
    "advanced excel", "power query", "dax", "google sheets", "microsoft office", "project management",
    "jira", "confluence", "asana", "trello", "slack", "teams"
  ]
};

export const ALL_HARD_SKILLS = Object.values(SKILL_DOMAINS).flat();

export const SOFT_SKILLS = [
    // Core Communication & Interpersonal Skills
    "communication", "verbal communication", "written communication", "presentation skills",
    "public speaking", "storytelling", "active listening", "interpersonal skills", "empathy",
    "emotional intelligence", "persuasion", "influencing", "negotiation", "conflict resolution",
    "diplomacy", "tact", "cultural sensitivity", "cross-cultural communication", "multilingual",
    "client communication", "stakeholder communication", "executive communication",
    "technical writing", "business writing", "report writing", "documentation skills",
    
    // Leadership & Management
    "leadership", "team leadership", "project leadership", "thought leadership", "mentoring", 
    "coaching", "team building", "team management", "people management", "talent development",
    "succession planning", "performance management", "feedback delivery", "motivation",
    "delegation", "empowerment", "change management", "organizational development",
    "strategic leadership", "visionary leadership", "servant leadership", "transformational leadership",
    "decision making", "strategic thinking", "executive presence", "board presentation",
    
    // Collaboration & Teamwork
    "teamwork", "collaboration", "cross-functional collaboration", "matrix management",
    "virtual team management", "remote collaboration", "partnership building", "relationship building",
    "networking", "community building", "alliance management", "vendor management",
    "supplier relationship management", "customer relationship management", "account management",
    "stakeholder management", "stakeholder engagement", "consensus building",
    
    // Problem Solving & Analysis
    "problem solving", "analytical thinking", "critical thinking", "strategic thinking",
    "systems thinking", "design thinking", "creative thinking", "innovative thinking",
    "logical reasoning", "deductive reasoning", "inductive reasoning", "pattern recognition",
    "root cause analysis", "troubleshooting", "debugging", "hypothesis testing",
    "research skills", "investigative skills", "fact-finding", "information gathering",
    "synthesis", "evaluation", "assessment", "judgment", "decision analysis",
    
    // Project & Time Management
    "project management", "program management", "portfolio management", "time management",
    "priority management", "resource management", "budget management", "scope management",
    "risk management", "quality management", "change control", "milestone tracking",
    "deadline management", "workflow optimization", "process improvement", "efficiency optimization",
    "productivity enhancement", "multitasking", "organization", "planning", "scheduling",
    "coordination", "logistics", "execution", "monitoring", "control", "closure",
    
    // Adaptability & Learning
    "adaptability", "flexibility", "agility", "resilience", "stress management", "composure",
    "emotional regulation", "self-awareness", "self-management", "continuous learning",
    "lifelong learning", "curiosity", "growth mindset", "learning agility", "knowledge transfer",
    "skill development", "professional development", "career development", "upskilling",
    "reskilling", "innovation", "creativity", "experimentation", "prototyping", "iteration",
    
    // Business & Commercial Acumen
    "business acumen", "commercial awareness", "market knowledge", "industry expertise",
    "competitive intelligence", "customer focus", "customer-centricity", "service orientation",
    "quality focus", "excellence orientation", "results orientation", "performance orientation",
    "outcome focus", "value creation", "profit consciousness", "cost awareness", "roi focus",
    "business development", "sales acumen", "marketing acumen", "financial acumen"
];
