
export const JOB_DOMAINS = [
  "DATA_ANALYSIS",
  "ECONOMICS_BUSINESS",
  "HUMAN_RESOURCES",
  "POLITICS_PUBLIC_RELATIONS",
  "STATISTICS",
  "GENERAL_TECH"
] as const;

export type JobDomain = typeof JOB_DOMAINS[number];

export interface AnalysisResult {
  final_score: number;
  keywords_present: string[];
  keywords_missing: string[];
  keywords_fuzzy: string[];
  hard_skills_found: string[];
  hard_skills_missing: string[];
  soft_skills_found: string[];
  soft_skills_missing: string[];
  sections_found: string[];
  measurable_results: boolean;
  measurable_count: number;
  word_count: number;
  issues: {
    hard_skills: number;
    soft_skills: number;
    sections_missing: string[];
    low_word_count: boolean;
    missing_measurable: boolean;
    too_long: boolean;
  };
}

export interface StandaloneAnalysisResult {
  formattingResult: FormattingResult;
  word_count: number;
  measurable_count: number;
  sections_found: string[];
  sections_missing: string[];
  top_skill_domain: JobDomain | 'N/A';
  detected_skills: Record<JobDomain, string[]>;
}

export interface FormattingResult {
  structure_score: number;
  long_paragraphs: number;
  bullet_usage: number;
  numbered_usage: number;
  line_count: number;
  paragraph_count: number;
  contact_info: {
    email: boolean;
    phone: boolean;
    score: number;
  };
  web_presence: boolean;
  overall_format_score: number;
}
