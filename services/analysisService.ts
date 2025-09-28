import { ALL_HARD_SKILLS, SKILL_DOMAINS, SOFT_SKILLS, STOPWORDS } from '../constants/skills';
import type { AnalysisResult, FormattingResult, JobDomain, StandaloneAnalysisResult } from '../types';

function normalize(text: string): string {
    let newText = text.toLowerCase();
    newText = newText.replace(/[_\-•,()[\]{}:;]/g, ' ');
    newText = newText.replace(/[/\\&]/g, ' ');
    newText = newText.replace(/(?<!\d)\.(?!\d)/g, ' ');
    newText = newText.replace(/\s+/g, ' ').trim();
    return newText;
}

function tokenize(text: string): string[] {
    const normalizedText = normalize(text);
    const tokens = new Set<string>();

    // FIX: Replaced chained filter with a guard clause to ensure proper type inference and avoid 'never' type errors.
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

// Using Levenshtein distance for similarity check, as a proxy for SequenceMatcher
function levenshtein(a: string, b: string): number {
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

function fuzzyMatch(word: string, candidateList: string[], threshold = 0.80): boolean {
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

function enhancedSkillExtraction(text: string, skillList: string[]): string[] {
    const foundSkills = new Set<string>();
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

function getCvBaseMetrics(cvText: string) {
    const wordCount = cvText.split(/\s+/).length;

    const measurablePatterns = [
        /\d+%/g, /\$\d+/g, /\d+k/g, /\d+m/g, /\d+\s*million/g,
        /increased.*\d+/g, /improved.*\d+/g, /reduced.*\d+/g,
        /achieved.*\d+/g, /exceeded.*\d+/g, /generated.*\d+/g,
        /\d+\s*years?\s+of\s+experience/g, /\d+\+\s*years?/g
    ];
    const measurableCount = measurablePatterns.reduce((acc, pattern) => acc + (cvText.match(pattern) || []).length, 0);

    const foundSections: string[] = [];
    const cvLower = cvText.toLowerCase();
    for (const section in SECTIONS) {
        if (SECTIONS[section as keyof typeof SECTIONS].some(kw => cvLower.includes(kw))) {
            foundSections.push(section);
        }
    }

    return { wordCount, measurableCount, foundSections };
}


export function analyzeCv(cvText: string, jdText: string, domain: JobDomain): AnalysisResult {
    const cvTokens = new Set(tokenize(cvText));
    const jdTokens = new Set(tokenize(jdText));

    // Use domain-specific hard skills, plus general tech skills
    const domainHardSkills = [...new Set([...SKILL_DOMAINS[domain], ...SKILL_DOMAINS.GENERAL_TECH])];
    
    const relevantHard = enhancedSkillExtraction(jdText, domainHardSkills);
    const relevantSoft = enhancedSkillExtraction(jdText, SOFT_SKILLS);

    const foundHard = enhancedSkillExtraction(cvText, relevantHard);
    const missingHard = relevantHard.filter(s => !foundHard.includes(s));
    
    const foundSoft = enhancedSkillExtraction(cvText, relevantSoft);
    const missingSoft = relevantSoft.filter(s => !foundSoft.includes(s));

    const present: string[] = [], missing: string[] = [], fuzzy: string[] = [];
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

    const finalScore = (
        0.35 * keywordScore +
        0.30 * hardScore +
        0.15 * softScore +
        0.10 * sectionScore +
        0.10 * (0.6 * lengthScore + 0.4 * measurableScore)
    ) * 100;

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

export function analyzeStandaloneCv(cvText: string): StandaloneAnalysisResult {
    const formattingResult = analyzeFormatting(cvText);
    const { wordCount, measurableCount, foundSections } = getCvBaseMetrics(cvText);
    const sections_missing = Object.keys(SECTIONS).filter(s => !foundSections.includes(s));

    const detected_skills = {} as Record<JobDomain, string[]>;
    let top_skill_domain: JobDomain | 'N/A' = 'N/A';
    let maxSkills = 0;

    for (const domain in SKILL_DOMAINS) {
        const domainKey = domain as JobDomain;
        const skillsInDomain = enhancedSkillExtraction(cvText, SKILL_DOMAINS[domainKey]);
        detected_skills[domainKey] = skillsInDomain;
        if (skillsInDomain.length > maxSkills) {
            maxSkills = skillsInDomain.length;
            top_skill_domain = domainKey;
        }
    }
    
    return {
        formattingResult,
        word_count: wordCount,
        measurable_count: measurableCount,
        sections_found: foundSections,
        sections_missing: sections_missing,
        top_skill_domain,
        detected_skills
    };
}


export function analyzeFormatting(cvText: string): FormattingResult {
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
    
    const formatScore = (
        structureScore * 0.3 +
        contactScore * 0.4 +
        (hasUrls ? 100 : 0) * 0.1 +
        Math.max(0, 100 - longParagraphs.length * 10) * 0.2
    );

    return {
        structure_score: structureScore,
        long_paragraphs: longParagraphs.length,
        bullet_usage: bulletLines.length,
        numbered_usage: numberedLines.length,
        line_count: nonEmptyLines.length,
        paragraph_count: paragraphs.length,
        contact_info: { email: hasEmail, phone: hasPhone, score: contactScore },
        web_presence: hasUrls,
        overall_format_score: Math.min(100, Math.round(formatScore))
    };
}

export function generateImprovementTips(analysisResult: AnalysisResult, formattingResult: FormattingResult): string[] {
    const tips: string[] = [];

    if (analysisResult.issues.hard_skills > 0) {
        const missingCritical = analysisResult.hard_skills_missing.slice(0, 5);
        tips.push(`Add these key technical skills: ${missingCritical.join(', ')}`);
    }
    if (analysisResult.issues.soft_skills > 0) {
        const missingSoft = analysisResult.soft_skills_missing.slice(0, 3);
        tips.push(`Include these soft skills: ${missingSoft.join(', ')}`);
    }
    if (analysisResult.measurable_count < 3) {
        tips.push("Add more quantified achievements (e.g., %, $, numbers).");
    }
    if (analysisResult.word_count < 600) {
        tips.push("Expand your CV content to provide more detail (aim for 800-1000 words).");
    } else if (analysisResult.word_count > 1200) {
        tips.push("Your CV is quite long. Consider condensing it for better readability.");
    }
    if (analysisResult.issues.sections_missing.length > 0) {
        tips.push(`Add missing sections like: ${analysisResult.issues.sections_missing.slice(0, 3).join(', ')}`);
    }
    if (formattingResult.long_paragraphs > 2) {
        tips.push("Break down long paragraphs into smaller, more readable chunks.");
    }
    if (formattingResult.bullet_usage < 5) {
        tips.push("Use more bullet points to highlight achievements and responsibilities.");
    }
    if (!formattingResult.contact_info.email) tips.push("Include your email address.");
    if (!formattingResult.contact_info.phone) tips.push("Include your phone number.");
    if (!formattingResult.web_presence) tips.push("Add your LinkedIn profile or portfolio website.");
    if (analysisResult.keywords_missing.length > 10) {
        const criticalMissing = analysisResult.keywords_missing.slice(0, 5);
        tips.push(`Weave in these important keywords from the job description: ${criticalMissing.join(', ')}`);
    }
    
    return tips;
}

export function generateComprehensiveReport(analysisResult: AnalysisResult, formattingResult: FormattingResult): string {
    const { final_score, keywords_present, keywords_missing, hard_skills_found, hard_skills_missing, soft_skills_found, soft_skills_missing, measurable_count, word_count, sections_found, issues } = analysisResult;

    const sections = [
        `# CV Analysis Report`,
        `## 1. Overall ATS Compatibility Score: ${final_score}%`,
        final_score >= 85 ? `This is an excellent score. Your CV is highly optimized for Applicant Tracking Systems.` :
        final_score >= 70 ? `This is a good score. Your CV has strong potential but could be improved for better ATS performance.` :
        `This score indicates there are significant opportunities for improvement to pass through ATS filters effectively.`,
        
        `## 2. Keyword Analysis`,
        `- Keywords Found: ${keywords_present.length}`,
        `- Keywords Missing: ${keywords_missing.length}`,
        `\n### Top Missing Keywords to Include:`,
        `${keywords_missing.slice(0, 15).map(kw => `- ${kw}`).join('\n') || 'None'}`,

        `## 3. Hard Skills Analysis`,
        `- Relevant Skills Found: ${hard_skills_found.length}`,
        `- Relevant Skills Missing: ${hard_skills_missing.length}`,
        `\n### Critical Hard Skills to Add:`,
        `${hard_skills_missing.slice(0, 15).map(skill => `- ${skill}`).join('\n') || 'None'}`,
        
        `## 4. Soft Skills Analysis`,
        `- Relevant Skills Found: ${soft_skills_found.length}`,
        `- Relevant Skills Missing: ${soft_skills_missing.length}`,
        `\n### Important Soft Skills to Emphasize:`,
        `${soft_skills_missing.slice(0, 10).map(skill => `- ${skill}`).join('\n') || 'None'}`,

        `## 5. Content & Structure Review`,
        `- Word Count: ${word_count} (Optimal is 800-1000 words)`,
        `- Quantified Achievements: ${measurable_count} found`,
        `- Sections Found: ${sections_found.join(', ') || 'None'}`,
        `- Sections Missing: ${issues.sections_missing.join(', ') || 'None'}`,

        `## 6. Formatting & Readability`,
        `- Overall Formatting Score: ${formattingResult.overall_format_score}%`,
        `- Contact Info: ${formattingResult.contact_info.email ? 'Email found' : 'Email missing'}, ${formattingResult.contact_info.phone ? 'Phone found' : 'Phone missing'}`,
        `- Web Presence (LinkedIn/Portfolio): ${formattingResult.web_presence ? 'Found' : 'Missing'}`,
        `- Long Paragraphs: ${formattingResult.long_paragraphs} (should be minimal)`,
        
        `## 7. Actionable Recommendations`,
        ...generateImprovementTips(analysisResult, formattingResult).map(tip => `- ${tip}`)
    ];

    return sections.join('\n\n');
}