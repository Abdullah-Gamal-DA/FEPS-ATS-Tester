

import React, { useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import mammoth from 'mammoth';

// --- Configuration ---
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.mjs`;

// --- START: Bundled Types ---
const JOB_DOMAINS = [
  "DATA_ANALYSIS",
  "ECONOMICS_BUSINESS",
  "HUMAN_RESOURCES",
  "POLITICS_PUBLIC_RELATIONS",
  "STATISTICS",
  "GENERAL_TECH"
];

// --- START: Bundled Skills Constants ---
const STOPWORDS = new Set(["and","or","the","a","an","to","for","of","in","on","with","by","from",
    "as","is","are","be","that","this","we","our","you","your","at","it",
    "using","use","used","will","can","ability","including","was","were","been",
    "have","has","had","do","does","did","would","could","should","may","might",
    "shall","must","need","want","like","get","got","go","went","come","came"]);

const SKILL_DOMAINS = {
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

const ALL_HARD_SKILLS = Object.values(SKILL_DOMAINS).flat();

const SOFT_SKILLS = [
    "communication", "verbal communication", "written communication", "presentation skills",
    "public speaking", "storytelling", "active listening", "interpersonal skills", "empathy",
    "emotional intelligence", "persuasion", "influencing", "negotiation", "conflict resolution",
    "diplomacy", "tact", "cultural sensitivity", "cross-cultural communication", "multilingual",
    "client communication", "stakeholder communication", "executive communication",
    "technical writing", "business writing", "report writing", "documentation skills",
    "leadership", "team leadership", "project leadership", "thought leadership", "mentoring", 
    "coaching", "team building", "team management", "people management", "talent development",
    "succession planning", "performance management", "feedback delivery", "motivation",
    "delegation", "empowerment", "change management", "organizational development",
    "strategic leadership", "visionary leadership", "servant leadership", "transformational leadership",
    "decision making", "strategic thinking", "executive presence", "board presentation",
    "teamwork", "collaboration", "cross-functional collaboration", "matrix management",
    "virtual team management", "remote collaboration", "partnership building", "relationship building",
    "networking", "community building", "alliance management", "vendor management",
    "supplier relationship management", "customer relationship management", "account management",
    "stakeholder management", "stakeholder engagement", "consensus building",
    "problem solving", "analytical thinking", "critical thinking", "strategic thinking",
    "systems thinking", "design thinking", "creative thinking", "innovative thinking",
    "logical reasoning", "deductive reasoning", "inductive reasoning", "pattern recognition",
    "root cause analysis", "troubleshooting", "debugging", "hypothesis testing",
    "research skills", "investigative skills", "fact-finding", "information gathering",
    "synthesis", "evaluation", "assessment", "judgment", "decision analysis",
    "project management", "program management", "portfolio management", "time management",
    "priority management", "resource management", "budget management", "scope management",
    "risk management", "quality management", "change control", "milestone tracking",
    "deadline management", "workflow optimization", "process improvement", "efficiency optimization",
    "productivity enhancement", "multitasking", "organization", "planning", "scheduling",
    "coordination", "logistics", "execution", "monitoring", "control", "closure",
    "adaptability", "flexibility", "agility", "resilience", "stress management", "composure",
    "emotional regulation", "self-awareness", "self-management", "continuous learning",
    "lifelong learning", "curiosity", "growth mindset", "learning agility", "knowledge transfer",
    "skill development", "professional development", "career development", "upskilling",
    "reskilling", "innovation", "creativity", "experimentation", "prototyping", "iteration",
    "business acumen", "commercial awareness", "market knowledge", "industry expertise",
    "competitive intelligence", "customer focus", "customer-centricity", "service orientation",
    "quality focus", "excellence orientation", "results orientation", "performance orientation",
    "outcome focus", "value creation", "profit consciousness", "cost awareness", "roi focus",
    "business development", "sales acumen", "marketing acumen", "financial acumen"
];

// --- START: Bundled File Reader Service ---
async function readFileAsArrayBuffer(file): Promise<ArrayBuffer> {
    // FIX: Type the promise to resolve with ArrayBuffer and cast the result. This fixes downstream errors where an ArrayBuffer is expected.
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}

async function readPdfFile(file) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    // FIX: pdfjs-dist getDocument expects data as Uint8Array, not ArrayBuffer directly.
    const pdf = await getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    return textContent;
}

async function readDocxFile(file) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

async function readTxtFile(file): Promise<string> {
    // FIX: Type the promise to resolve with a string and cast the result. This ensures type safety for consumers of this function.
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

// --- START: Bundled Gemini Service ---
function getAiInstance() {
    if (!process.env.API_KEY) {
        throw new Error("Gemini API Key is not configured. Please ensure the API_KEY environment variable is set.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

async function detectJobDomain(jdContent) {
  const ai = getAiInstance();
  const domains = JOB_DOMAINS.join(', ');

  const prompt = `
    Based on the following job description, which of these categories does it best fit into?
    Categories: ${domains}
    Respond with ONLY the single most relevant category name from the list above.
    Job Description:
    ---
    ${jdContent.substring(0, 2000)}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    const detectedDomain = response.text.trim().toUpperCase();
    if (JOB_DOMAINS.includes(detectedDomain)) {
        return detectedDomain;
    }
    return 'GENERAL_TECH'; 
  } catch (error) {
    console.error("Error detecting job domain:", error);
    return 'GENERAL_TECH';
  }
}

async function optimizeCvWithGemini(cvContent, jdContent) {
  const ai = getAiInstance();
  const optimization_prompt = `
    You are a professional CV optimization expert specializing in ATS (Applicant Tracking System) optimization.
    Please analyze and optimize the following CV for the given job description:
    JOB DESCRIPTION:
    ---
    ${jdContent}
    ---
    CURRENT CV:
    ---
    ${cvContent}
    ---
    Please provide an optimized version of the CV that maintains the candidate's authentic experience while improving ATS compatibility.
    Focus on the following:
    1.  **Keyword Optimization**: Seamlessly integrate relevant keywords from the job description.
    2.  **Structure & Readability**: Improve the structure for clarity and impact. Use bullet points effectively.
    3.  **Quantified Achievements**: Rephrase responsibilities into quantified, results-oriented achievements where possible.
    4.  **Tone & Professionalism**: Maintain a professional tone suitable for the target role.
    5.  **Truthfulness**: Do NOT fabricate experience or skills. Enhance the presentation of existing information.
    6.  **Highlighting Skills**: Ensure critical skills from the job description are appropriately highlighted.
    Return ONLY the full, optimized CV content, formatted professionally. Do not include any introductory text, preamble, or explanation before or after the CV content.
    `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: optimization_prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get response from AI. Please check your API key and network connection.");
  }
}

// --- START: Bundled Analysis Service ---
function normalize(text) {
    let newText = String(text || '').toLowerCase();
    newText = newText.replace(/[_\-•,()[\]{}:;]/g, ' ');
    newText = newText.replace(/[/\\&]/g, ' ');
    newText = newText.replace(/(?<!\d)\.(?!\d)/g, ' ');
    newText = newText.replace(/\s+/g, ' ').trim();
    return newText;
}

function tokenize(text) {
    const normalizedText = normalize(text);
    const tokens = new Set();
    const words = normalizedText.match(/[a-z0-9+#.%]+/g);
    if (words) {
        words.filter(w => !STOPWORDS.has(w) && w.length > 1).forEach(w => tokens.add(w));
    }
    const compound_patterns = [
        /data\s+analysis/g, /machine\s+learning/g, /business\s+intelligence/g,
        /data\s+science/g, /statistical\s+modeling/g, /project\s+management/g,
        /customer\s+relationship\s+management/g, /supply\s+chain/g, /financial\s+modeling/g,
        /market\s+research/g, /competitive\s+analysis/g, /feasibility\s+studies/g,
        /cost\s+benefit\s+analysis/g, /return\s+on\s+investment/g, /key\s+performance\s+indicators/g
    ];
    compound_patterns.forEach(pattern => {
        const matches = normalizedText.match(pattern);
        if (matches) {
            matches.forEach(match => tokens.add(match.replace(/\s+/g, ' ')));
        }
    });
    return Array.from(tokens);
}

function levenshtein(a, b) {
    const an = a.length;
    const bn = b.length;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = Array(an + 1).fill(0).map(() => Array(bn + 1).fill(0));
    for (let i = 0; i <= an; i++) matrix[i][0] = i;
    for (let j = 0; j <= bn; j++) matrix[0][j] = j;
    for (let i = 1; i <= an; i++) {
        for (let j = 1; j <= bn; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[an][bn];
}

function fuzzyMatch(word, candidateList, threshold = 0.80) {
    const wordNormalized = normalize(word);
    for (const candidate of candidateList) {
        const candidateNormalized = normalize(candidate);
        if (wordNormalized === candidateNormalized) return true;
        if (wordNormalized.length > 5 && candidateNormalized.includes(wordNormalized)) return true;
        if (candidateNormalized.length > 5 && wordNormalized.includes(candidateNormalized)) return true;
        const distance = levenshtein(wordNormalized, candidateNormalized);
        const ratio = 1 - distance / Math.max(wordNormalized.length, candidateNormalized.length);
        if (ratio >= threshold) return true;
    }
    return false;
}

function enhancedSkillExtraction(text, skillList) {
    const foundSkills = new Set();
    const textNormalized = normalize(text);
    const textTokens = new Set(tokenize(text));
    for (const skill of skillList) {
        const skillNormalized = normalize(skill);
        if (skillNormalized.split(' ').length > 1) {
            if (textNormalized.includes(skillNormalized)) {
                foundSkills.add(skill);
                continue;
            }
        }
        if (textTokens.has(skillNormalized) || fuzzyMatch(skillNormalized, Array.from(textTokens))) {
            foundSkills.add(skill);
        }
    }
    return Array.from(foundSkills);
}

const SECTIONS = {
    summary: ["summary", "profile", "objective", "about"],
    experience: ["experience", "employment", "work history", "career"],
    education: ["education", "academic", "qualifications", "degree"],
    skills: ["skills", "competencies", "expertise", "abilities"],
    projects: ["projects", "portfolio", "accomplishments"],
    certifications: ["certifications", "certificates", "credentials", "licenses"]
};

function getCvBaseMetrics(cvText) {
    const wordCount = cvText.split(/\s+/).length;
    const measurablePatterns = [/\d+%/g, /\$\d+/g, /\d+k/g, /\d+m/g, /\d+\s*million/g, /increased.*\d+/g, /improved.*\d+/g, /reduced.*\d+/g, /achieved.*\d+/g, /exceeded.*\d+/g, /generated.*\d+/g, /\d+\s*years?\s+of\s+experience/g, /\d+\+\s*years?/g];
    const measurableCount = measurablePatterns.reduce((acc, pattern) => acc + (cvText.match(pattern) || []).length, 0);
    const foundSections = [];
    const cvLower = cvText.toLowerCase();
    // FIX: Use a type-safe loop to iterate over SECTIONS keys. The `for...in` loop can cause type inference issues.
    for (const section of Object.keys(SECTIONS) as Array<keyof typeof SECTIONS>) {
        if (SECTIONS[section].some(kw => cvLower.includes(kw))) {
            foundSections.push(section);
        }
    }
    return { wordCount, measurableCount, foundSections };
}

function analyzeCv(cvText, jdText, domain) {
    const cvTokens = new Set(tokenize(cvText));
    const jdTokens = new Set(tokenize(jdText));
    const domainHardSkills = [...new Set([...SKILL_DOMAINS[domain], ...SKILL_DOMAINS.GENERAL_TECH])];
    const relevantHard = enhancedSkillExtraction(jdText, domainHardSkills);
    const relevantSoft = enhancedSkillExtraction(jdText, SOFT_SKILLS);
    const foundHard = enhancedSkillExtraction(cvText, relevantHard);
    const missingHard = relevantHard.filter(s => !foundHard.includes(s));
    const foundSoft = enhancedSkillExtraction(cvText, relevantSoft);
    const missingSoft = relevantSoft.filter(s => !foundSoft.includes(s));
    const present = [], missing = [], fuzzy = [];
    jdTokens.forEach(kw => {
        if (kw.length < 3) return;
        if (cvTokens.has(kw)) {
            present.push(kw);
        } else if (fuzzyMatch(kw, Array.from(cvTokens))) {
            fuzzy.push(kw);
        } else {
            missing.push(kw);
        }
    });
    const { wordCount, measurableCount, foundSections } = getCvBaseMetrics(cvText);
    const measurableScore = Math.min(measurableCount / 5, 1.0);
    const optimalLength = 800;
    const lengthScore = Math.min(wordCount / optimalLength, 1.0) * 0.8 + 0.2;
    const totalKeywords = present.length + missing.length + fuzzy.length;
    const keywordScore = totalKeywords > 0 ? ((present.length * 1.0 + fuzzy.length * 0.6) / totalKeywords) : 1.0;
    const hardScore = relevantHard.length > 0 ? foundHard.length / relevantHard.length : 1;
    const softScore = relevantSoft.length > 0 ? foundSoft.length / relevantSoft.length : 1;
    const sectionScore = foundSections.length / Object.keys(SECTIONS).length;
    const finalScore = (0.35 * keywordScore + 0.30 * hardScore + 0.15 * softScore + 0.10 * sectionScore + 0.10 * (0.6 * lengthScore + 0.4 * measurableScore)) * 100;
    return {
        final_score: Math.round(finalScore),
        keywords_present: present,
        keywords_missing: missing,
        keywords_fuzzy: fuzzy,
        hard_skills_found: foundHard,
        hard_skills_missing: missingHard,
        soft_skills_found: foundSoft,
        soft_skills_missing: missingSoft,
        sections_found: foundSections,
        measurable_results: measurableCount > 0,
        measurable_count: measurableCount,
        word_count: wordCount,
        issues: {
            hard_skills: missingHard.length,
            soft_skills: missingSoft.length,
            sections_missing: Object.keys(SECTIONS).filter(s => !foundSections.includes(s)),
            low_word_count: wordCount < 600,
            missing_measurable: measurableCount === 0,
            too_long: wordCount > 1200
        }
    };
}

function analyzeStandaloneCv(cvText) {
    const formattingResult = analyzeFormatting(cvText);
    const { wordCount, measurableCount, foundSections } = getCvBaseMetrics(cvText);
    const sections_missing = Object.keys(SECTIONS).filter(s => !foundSections.includes(s));
    const detected_skills = {};
    let top_skill_domain = 'N/A';
    let maxSkills = 0;
    for (const domain in SKILL_DOMAINS) {
        const domainKey = domain;
        const skillsInDomain = enhancedSkillExtraction(cvText, SKILL_DOMAINS[domainKey as keyof typeof SKILL_DOMAINS]);
        detected_skills[domainKey] = skillsInDomain;
        if (skillsInDomain.length > maxSkills) {
            maxSkills = skillsInDomain.length;
            top_skill_domain = domainKey;
        }
    }
    return { formattingResult, word_count: wordCount, measurable_count: measurableCount, sections_found: foundSections, sections_missing: sections_missing, top_skill_domain, detected_skills };
}

function analyzeFormatting(cvText) {
    const lines = cvText.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim());
    const paragraphs = cvText.split('\n\n').filter(p => p.trim());
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 50);
    const bulletLines = lines.filter(line => /^\s*[-*•]\s/.test(line));
    const numberedLines = lines.filter(line => /^\s*\d+[.)]\s/.test(line));
    const structureScore = Math.min(100, (bulletLines.length + numberedLines.length) * 5);
    const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(cvText);
    const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(cvText);
    const contactScore = (Number(hasEmail) + Number(hasPhone)) * 50;
    const hasUrls = /https?:\/\/[^\s]+|www\.[^\s]+|linkedin\.com\/in\/[^\s]+/i.test(cvText);
    const formatScore = (structureScore * 0.3 + contactScore * 0.4 + (hasUrls ? 100 : 0) * 0.1 + Math.max(0, 100 - longParagraphs.length * 10) * 0.2);
    return {
        structure_score: structureScore, long_paragraphs: longParagraphs.length, bullet_usage: bulletLines.length, numbered_usage: numberedLines.length, line_count: nonEmptyLines.length, paragraph_count: paragraphs.length,
        contact_info: { email: hasEmail, phone: hasPhone, score: contactScore }, web_presence: hasUrls, overall_format_score: Math.min(100, Math.round(formatScore))
    };
}

function generateImprovementTips(analysisResult, formattingResult) {
    const tips = [];
    if (analysisResult.issues.hard_skills > 0) tips.push(`Add these key technical skills: ${analysisResult.hard_skills_missing.slice(0, 5).join(', ')}`);
    if (analysisResult.issues.soft_skills > 0) tips.push(`Include these soft skills: ${analysisResult.soft_skills_missing.slice(0, 3).join(', ')}`);
    if (analysisResult.measurable_count < 3) tips.push("Add more quantified achievements (e.g., %, $, numbers).");
    if (analysisResult.word_count < 600) tips.push("Expand your CV content to provide more detail (aim for 800-1000 words).");
    else if (analysisResult.word_count > 1200) tips.push("Your CV is quite long. Consider condensing it for better readability.");
    if (analysisResult.issues.sections_missing.length > 0) tips.push(`Add missing sections like: ${analysisResult.issues.sections_missing.slice(0, 3).join(', ')}`);
    if (formattingResult.long_paragraphs > 2) tips.push("Break down long paragraphs into smaller, more readable chunks.");
    if (formattingResult.bullet_usage < 5) tips.push("Use more bullet points to highlight achievements and responsibilities.");
    if (!formattingResult.contact_info.email) tips.push("Include your email address.");
    if (!formattingResult.contact_info.phone) tips.push("Include your phone number.");
    if (!formattingResult.web_presence) tips.push("Add your LinkedIn profile or portfolio website.");
    if (analysisResult.keywords_missing.length > 10) tips.push(`Weave in these important keywords from the job description: ${analysisResult.keywords_missing.slice(0, 5).join(', ')}`);
    return tips;
}

function generateComprehensiveReport(analysisResult, formattingResult) {
    const { final_score, keywords_present, keywords_missing, hard_skills_found, hard_skills_missing, soft_skills_found, soft_skills_missing, measurable_count, word_count, sections_found, issues } = analysisResult;
    const sections = [
        `# CV Analysis Report`, `## 1. Overall ATS Compatibility Score: ${final_score}%`,
        final_score >= 85 ? `This is an excellent score. Your CV is highly optimized for Applicant Tracking Systems.` : final_score >= 70 ? `This is a good score. Your CV has strong potential but could be improved for better ATS performance.` : `This score indicates there are significant opportunities for improvement to pass through ATS filters effectively.`,
        `## 2. Keyword Analysis`, `- Keywords Found: ${keywords_present.length}`, `- Keywords Missing: ${keywords_missing.length}`, `\n### Top Missing Keywords to Include:`, `${keywords_missing.slice(0, 15).map((kw) => `- ${kw}`).join('\n') || 'None'}`,
        `## 3. Hard Skills Analysis`, `- Relevant Skills Found: ${hard_skills_found.length}`, `- Relevant Skills Missing: ${hard_skills_missing.length}`, `\n### Critical Hard Skills to Add:`, `${hard_skills_missing.slice(0, 15).map((skill) => `- ${skill}`).join('\n') || 'None'}`,
        `## 4. Soft Skills Analysis`, `- Relevant Skills Found: ${soft_skills_found.length}`, `- Relevant Skills Missing: ${soft_skills_missing.length}`, `\n### Important Soft Skills to Emphasize:`, `${soft_skills_missing.slice(0, 10).map((skill) => `- ${skill}`).join('\n') || 'None'}`,
        `## 5. Content & Structure Review`, `- Word Count: ${word_count} (Optimal is 800-1000 words)`, `- Quantified Achievements: ${measurable_count} found`, `- Sections Found: ${sections_found.join(', ') || 'None'}`, `- Sections Missing: ${issues.sections_missing.join(', ') || 'None'}`,
        `## 6. Formatting & Readability`, `- Overall Formatting Score: ${formattingResult.overall_format_score}%`, `- Contact Info: ${formattingResult.contact_info.email ? 'Email found' : 'Email missing'}, ${formattingResult.contact_info.phone ? 'Phone found' : 'Phone missing'}`, `- Web Presence (LinkedIn/Portfolio): ${formattingResult.web_presence ? 'Found' : 'Missing'}`, `- Long Paragraphs: ${formattingResult.long_paragraphs} (should be minimal)`,
        `## 7. Actionable Recommendations`, ...generateImprovementTips(analysisResult, formattingResult).map(tip => `- ${tip}`)
    ];
    return sections.join('\n\n');
}

// --- START: Bundled App Component ---
const IconFile = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
const IconAnalyze = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const IconOptimize = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>;
const IconCopy = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>;

const Loader = ({ message }) => (
    <div className="absolute inset-0 bg-slate-200 bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center p-4">
            <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-slate-700 font-semibold text-lg">{message}</p>
            <p className="text-slate-500">This may take a moment.</p>
        </div>
    </div>
);

const ScoreGauge = ({ score }) => {
    const getScoreColor = (s) => s >= 85 ? 'text-emerald-500' : s >= 70 ? 'text-amber-500' : 'text-red-500';
    const getScoreRingColor = (s) => s >= 85 ? 'stroke-emerald-500' : s >= 70 ? 'stroke-amber-500' : 'stroke-red-500';
    const getScoreStatus = (s) => s >= 85 ? 'Excellent' : s >= 70 ? 'Good' : s >= 50 ? 'Fair' : 'Needs Work';
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    return (
        <div className="relative flex items-center justify-center w-56 h-56">
            <svg className="w-full h-full" viewBox="0 0 200 200">
                <circle className="text-slate-200" strokeWidth="12" stroke="currentColor" fill="transparent" r={radius} cx="100" cy="100" />
                <circle className={`${getScoreRingColor(score)} transition-all duration-1000 ease-in-out`} strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="100" cy="100" transform="rotate(-90 100 100)" />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}<span className="text-2xl">%</span></span>
                <span className={`text-lg font-semibold ${getScoreColor(score)}`}>{getScoreStatus(score)}</span>
                <span className="text-sm text-slate-500">ATS Match</span>
            </div>
        </div>
    );
};

const ProgressBar = ({ value, label }) => {
    const getBarColor = (v) => v >= 85 ? 'bg-emerald-500' : v >= 70 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-600">{label}</span>
                <span className="text-sm font-bold text-slate-800">{value}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5"><div className={`${getBarColor(value)} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div></div>
        </div>
    );
};

const App = () => {
    const [mode, setMode] = useState('comparison');
    const [jdText, setJdText] = useState('');
    const [cvText, setCvText] = useState('');
    const [comparisonResult, setComparisonResult] = useState(null);
    const [formattingResult, setFormattingResult] = useState(null);
    const [standaloneResult, setStandaloneResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState(null);
    const [optimizedCv, setOptimizedCv] = useState('');
    const [activeTab, setActiveTab] = useState('summary');
    const [copySuccess, setCopySuccess] = useState('');

    const handleFileChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsLoading(true);
        setLoadingMessage(`Reading ${file.name}...`);
        setError(null);
        try {
            let content = '';
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (fileExtension === 'pdf') content = await readPdfFile(file);
            else if (fileExtension === 'docx') content = await readDocxFile(file);
            else if (fileExtension === 'txt') content = await readTxtFile(file);
            else throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
            setCvText(content);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || "Failed to read the file. It might be corrupted or protected.");
            } else {
                setError("Failed to read the file. It might be corrupted or protected.");
            }
        } finally {
            setIsLoading(false);
        }
        e.target.value = '';
    }, []);

    const handleAnalyze = useCallback(async () => {
        setError(null);
        setComparisonResult(null);
        setStandaloneResult(null);
        if (!cvText) {
            setError("Please provide your CV content.");
            return;
        }
        if (mode === 'comparison') {
            if (!jdText) {
                setError("Please provide the Job Description content for comparison.");
                return;
            }
            setIsLoading(true);
            setLoadingMessage('Detecting job domain...');
            try {
                const domain = await detectJobDomain(jdText);
                setLoadingMessage(`Analyzing CV for ${domain.replace('_', ' ')} role...`);
                const analysis = analyzeCv(cvText, jdText, domain);
                const formatting = analyzeFormatting(cvText);
                setComparisonResult(analysis);
                setFormattingResult(formatting);
                setActiveTab('summary');
            } catch (e) {
                if (e instanceof Error) {
                    setError(e.message || "An unknown error occurred during analysis.");
                } else {
                    setError("An unknown error occurred during analysis.");
                }
            } finally {
                setIsLoading(false);
            }
        } else {
             setIsLoading(true);
             setLoadingMessage('Performing CV Health Check...');
             try {
                const analysis = analyzeStandaloneCv(cvText);
                setStandaloneResult(analysis);
             } catch (e) {
                if (e instanceof Error) {
                    setError(e.message || "An unknown error occurred during analysis.");
                } else {
                    setError("An unknown error occurred during analysis.");
                }
             } finally {
                setIsLoading(false);
             }
        }
    }, [cvText, jdText, mode]);

    const handleOptimize = useCallback(async () => {
        if (!cvText || !jdText) {
            setError("Please provide both CV and Job Description to use AI optimization.");
            return;
        }
        setError(null);
        setIsLoading(true);
        setLoadingMessage('AI is optimizing your CV...');
        try {
            const optimized = await optimizeCvWithGemini(cvText, jdText);
            setOptimizedCv(optimized);
            setMode('comparison');
            setActiveTab('optimized');
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message || "Failed to optimize CV.");
            } else {
                setError("Failed to optimize CV.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [cvText, jdText]);

    const improvementTips = useMemo(() => {
        if (mode === 'comparison' && comparisonResult && formattingResult) {
            return generateImprovementTips(comparisonResult, formattingResult);
        }
        return [];
    }, [mode, comparisonResult, formattingResult]);
    
    const comprehensiveReport = useMemo(() => {
        if (mode === 'comparison' && comparisonResult && formattingResult) {
            return generateComprehensiveReport(comparisonResult, formattingResult);
        }
        return '';
    }, [mode, comparisonResult, formattingResult]);

    const handleCopyReport = () => {
        navigator.clipboard.writeText(comprehensiveReport).then(() => {
            setCopySuccess('Report copied to clipboard!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Failed to copy report.');
        });
    };

    const renderComparisonResults = () => {
        if (!comparisonResult || !formattingResult) return <p className="text-slate-500 p-6 text-center">Run an analysis to see detailed results here.</p>;
        const tabs = [ { id: 'summary', label: 'Summary' }, { id: 'report', label: 'Full Report' }, { id: 'skills', label: 'Skills Analysis' }, { id: 'recommendations', label: 'Recommendations' }, { id: 'optimized', label: 'AI Optimized CV' }];
        const renderTabContent = () => {
            switch (activeTab) {
                case 'summary': return <div className="p-6 space-y-4"><h3 className="text-xl font-bold text-slate-800">Analysis Summary</h3><p><strong>Overall ATS Score:</strong> <span className="font-bold text-blue-600">{comparisonResult.final_score}%</span></p><p><strong>Keyword Match:</strong> {comparisonResult.keywords_present.length} found, {comparisonResult.keywords_missing.length} missing.</p><p><strong>Hard Skills Match:</strong> {comparisonResult.hard_skills_found.length} / {comparisonResult.hard_skills_found.length + comparisonResult.hard_skills_missing.length}</p><p><strong>Quantified Achievements:</strong> {comparisonResult.measurable_count} found.</p></div>;
                case 'report': return <div className="p-6"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-slate-800">Comprehensive Report</h3><button onClick={handleCopyReport} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"><IconCopy /> {copySuccess || 'Copy Report'}</button></div><textarea readOnly value={comprehensiveReport} className="w-full h-[60vh] p-3 font-mono text-sm border border-slate-300 rounded-md bg-slate-50 text-slate-800" placeholder="Generating report..."></textarea></div>;
                case 'skills': return <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"><div><h4 className="text-lg font-semibold text-slate-700 mb-2">Hard Skills</h4><p className="text-sm mb-2 text-slate-500">Found: {comparisonResult.hard_skills_found.length}, Missing: {comparisonResult.hard_skills_missing.length}</p><h5 className="font-semibold text-emerald-600">Found:</h5><ul className="list-disc list-inside text-sm text-slate-600 max-h-48 overflow-y-auto bg-slate-50 p-2 rounded">{comparisonResult.hard_skills_found.map((s) => <li key={s}>{s}</li>)}</ul><h5 className="font-semibold text-red-600 mt-4">Missing:</h5><ul className="list-disc list-inside text-sm text-slate-600 max-h-48 overflow-y-auto bg-slate-50 p-2 rounded">{comparisonResult.hard_skills_missing.map((s) => <li key={s}>{s}</li>)}</ul></div><div><h4 className="text-lg font-semibold text-slate-700 mb-2">Soft Skills</h4><p className="text-sm mb-2 text-slate-500">Found: {comparisonResult.soft_skills_found.length}, Missing: {comparisonResult.soft_skills_missing.length}</p><h5 className="font-semibold text-emerald-600">Found:</h5><ul className="list-disc list-inside text-sm text-slate-600 max-h-48 overflow-y-auto bg-slate-50 p-2 rounded">{comparisonResult.soft_skills_found.map((s) => <li key={s}>{s}</li>)}</ul><h5 className="font-semibold text-red-600 mt-4">Missing:</h5><ul className="list-disc list-inside text-sm text-slate-600 max-h-48 overflow-y-auto bg-slate-50 p-2 rounded">{comparisonResult.soft_skills_missing.map((s) => <li key={s}>{s}</li>)}</ul></div></div>;
                case 'recommendations': return <div className="p-6"><h3 className="text-xl font-bold text-slate-800 mb-4">Improvement Tips</h3><ul className="space-y-3">{improvementTips.map((tip, index) => (<li key={index} className="flex items-start p-3 bg-blue-50 rounded-lg"><span className="mr-3 text-blue-500">💡</span><span className="text-slate-700">{tip}</span></li>))}</ul></div>;
                case 'optimized': return <div className="p-6"><h3 className="text-xl font-bold text-slate-800 mb-4">AI Optimized CV</h3>{optimizedCv ? <pre className="whitespace-pre-wrap font-sans text-sm bg-slate-50 p-4 rounded-md border border-slate-200 max-h-[60vh] overflow-y-auto">{optimizedCv}</pre> : <p className="text-slate-500">Click "AI Optimize" to generate an enhanced version of your CV.</p>}</div>;
                default: return null;
            }
        };
        return (
            <div className="bg-white rounded-xl shadow-lg">
                <h2 className="text-xl font-bold p-6 border-b border-slate-200">2. Results & Recommendations</h2>
                <div className="border-b border-slate-200"><nav className="-mb-px flex space-x-6 px-6 overflow-x-auto" aria-label="Tabs">{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>{tab.label}</button>))}</nav></div>
                <div className="min-h-[200px]">{renderTabContent()}</div>
            </div>
        );
    };

    const renderStandaloneResults = () => {
        if (!standaloneResult) return <p className="text-slate-500 p-6 text-center">Run a health check to see your CV's general analysis here.</p>;
        const { formattingResult: fr, top_skill_domain } = standaloneResult;
        return (
             <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">CV Health Check Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Content & Structure</h3>
                        <p><strong>Word Count:</strong> {standaloneResult.word_count}</p>
                        <p><strong>Quantified Achievements:</strong> {standaloneResult.measurable_count}</p>
                        <p><strong>Sections Found:</strong> {standaloneResult.sections_found.length} / 6 ({standaloneResult.sections_found.join(', ') || 'None'})</p>
                        {standaloneResult.sections_missing.length > 0 && <p className="text-red-600"><strong>Missing Sections:</strong> {standaloneResult.sections_missing.join(', ')}</p>}
                    </div>
                     <div>
                        <h3 className="font-semibold text-lg mb-2">Formatting Score: <span className="text-blue-600">{fr.overall_format_score}%</span></h3>
                        <p><strong>Contact Info:</strong> {fr.contact_info.email ? '✅' : '❌'} Email, {fr.contact_info.phone ? '✅' : '❌'} Phone</p>
                        <p><strong>Web Presence (LinkedIn/Portfolio):</strong> {fr.web_presence ? '✅ Found' : '❌ Missing'}</p>
                        <p><strong>Long Paragraphs:</strong> {fr.long_paragraphs} (Aim for 0-2)</p>
                     </div>
                </div>
                <div className="mt-6 border-t pt-4">
                    <h3 className="font-semibold text-lg mb-2">Skill Profile</h3>
                    <p><strong>Primary Skill Domain Detected:</strong> <span className="font-bold text-blue-600">{top_skill_domain.replace(/_/g, ' ')}</span></p>
                    <p className="text-sm text-slate-500">Based on this profile, your CV appears most suitable for roles in this field.</p>
                </div>
             </div>
        );
    };
    
    return (
        <div className="bg-slate-100 min-h-screen font-sans text-slate-800">
            {isLoading && <Loader message={loadingMessage} />}
            <header className="bg-white shadow-sm"><div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8"><h1 className="text-2xl font-bold text-slate-900">FEPS Advanced ATS CV Optimizer</h1><p className="text-sm text-slate-500">Intelligent analysis for your professional journey.</p></div></header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
                        <h2 className="text-xl font-bold mb-4">Analysis Dashboard</h2>
                        {mode === 'comparison' && (comparisonResult ? <ScoreGauge score={comparisonResult.final_score} /> : <div className="flex items-center justify-center w-56 h-56 bg-slate-50 rounded-full"><p className="text-slate-500 text-center">Run analysis to see ATS score</p></div>)}
                        {mode === 'standalone' && (standaloneResult ? <ScoreGauge score={standaloneResult.formattingResult.overall_format_score} /> : <div className="flex items-center justify-center w-56 h-56 bg-slate-50 rounded-full"><p className="text-slate-500 text-center">Run analysis to see health score</p></div>)}
                        <div className="w-full mt-6">
                            {mode === 'comparison' && comparisonResult && formattingResult && (<>
                                <ProgressBar label="Keyword Match" value={Math.round(((comparisonResult.keywords_present.length + comparisonResult.keywords_fuzzy.length * 0.6) / (comparisonResult.keywords_present.length + comparisonResult.keywords_missing.length + comparisonResult.keywords_fuzzy.length)) * 100)} />
                                <ProgressBar label="Hard Skills" value={Math.round((comparisonResult.hard_skills_found.length / (comparisonResult.hard_skills_found.length + comparisonResult.hard_skills_missing.length)) * 100)} />
                                <ProgressBar label="Formatting" value={Math.round(formattingResult.overall_format_score)} />
                            </>)}
                        </div>
                         <div className="w-full mt-4 p-4 bg-slate-50 rounded-lg max-h-48 overflow-y-auto">
                            <h3 className="font-bold text-slate-700 mb-2">Quick Tips</h3>
                            {mode === 'comparison' && improvementTips.length > 0 ? (<ul className="list-disc list-inside text-sm text-slate-600 space-y-1">{improvementTips.slice(0, 4).map((tip, i) => <li key={i}>{tip}</li>)}</ul>) : (<p className="text-sm text-slate-500">Tips will appear here after analysis.</p>)}
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <div className="mb-4"><div className="isolate flex divide-x divide-gray-200 rounded-lg shadow-sm"><button onClick={() => setMode('comparison')} className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 ${mode === 'comparison' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}>CV vs. Job Description Match</button><button onClick={() => setMode('standalone')} className={`relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 ${mode === 'standalone' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}>Standalone CV Health Check</button></div></div>
                             {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert"><span className="block sm:inline">{error}</span></div>}
                            <div className={`grid grid-cols-1 ${mode === 'comparison' ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
                                <div>
                                    <label htmlFor="cv" className="block text-sm font-medium text-slate-700 mb-1">Your CV Content</label>
                                    <textarea id="cv" rows={mode === 'comparison' ? 10 : 20} value={cvText} onChange={(e) => setCvText(e.target.value)} className="w-full p-3 font-mono text-sm border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-400" placeholder="Paste your CV content here, or upload a file..."></textarea>
                                    <label htmlFor="file-upload" className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 cursor-pointer"><IconFile /> Upload CV (PDF, DOCX, TXT)</label>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,.docx,.txt" onChange={handleFileChange} />
                                </div>
                                {mode === 'comparison' && (<div>
                                    <label htmlFor="jd" className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
                                    <textarea id="jd" rows={10} value={jdText} onChange={(e) => setJdText(e.target.value)} className="w-full p-3 font-mono text-sm border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-400" placeholder="Paste the job description here..."></textarea>
                                </div>)}
                            </div>
                             <div className="mt-6 flex flex-col sm:flex-row gap-4">
                                <button onClick={handleAnalyze} disabled={isLoading} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed"><IconAnalyze /> {mode === 'comparison' ? 'Analyze CV vs. JD' : 'Run CV Health Check'}</button>
                                {mode === 'comparison' && <button onClick={handleOptimize} disabled={isLoading} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-slate-400 disabled:cursor-not-allowed"><IconOptimize /> AI Optimize</button>}
                            </div>
                        </div>
                        {mode === 'comparison' && renderComparisonResults()}
                        {mode === 'standalone' && renderStandaloneResults()}
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- App Initialization ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);