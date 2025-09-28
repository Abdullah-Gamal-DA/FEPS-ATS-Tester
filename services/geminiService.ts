
import { GoogleGenAI } from "@google/genai";
import { JOB_DOMAINS, JobDomain } from "../types";

function getAiInstance() {
    // FIX: Per coding guidelines, assume API_KEY is always available in the environment.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export async function detectJobDomain(jdContent: string): Promise<JobDomain> {
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
    
    const detectedDomain = response.text.trim().toUpperCase() as JobDomain;
    if (JOB_DOMAINS.includes(detectedDomain)) {
        return detectedDomain;
    }
    // Fallback if the response is not a valid domain
    return 'GENERAL_TECH'; 
  } catch (error) {
    console.error("Error detecting job domain:", error);
    // Fallback in case of API error
    return 'GENERAL_TECH';
  }
}

export async function optimizeCvWithGemini(cvContent: string, jdContent: string): Promise<string> {
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