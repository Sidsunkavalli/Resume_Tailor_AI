import { GoogleGenAI, Type } from "@google/genai";
import { TailoredSuggestions, ScreeningPrepItem, ChatMessage } from '../types';

const getResumeSuggestions = async (resumeText: string, jobDescription: string): Promise<TailoredSuggestions & { suggestedSessionName: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const prompt = `
    As an expert ATS (Applicant Tracking System) algorithm and senior recruiter, analyze the following resume and job description.
    
    **CRITICAL SCORING INSTRUCTIONS (READ CAREFULLY):**
    You must evaluate the \`initialMatchScore\` based on strictly objective criteria, not subjective feeling.
    1. **Keyword Audit**: Scan the resume for the top hard skills, software, and qualifications explicitly listed in the Job Description.
    2. **Score Calculation**:
       - **90-100 (Excellent Match)**: The resume already contains almost all (90%+) of the keywords, skills, and exact phrasing found in the JD. It looks like a tailored resume. **Do not artificially lower this score.** If they have fixed the resume based on previous advice, acknowledge it with a high score.
       - **75-89 (Good Match)**: The resume has most major skills but misses a few specific keywords or lacks quantitative results.
       - **60-74 (Average Match)**: The candidate has the general background but uses different terminology or misses key "must-have" skills.
       - **< 60 (Low Match)**: Major skills missing.
    
    **If the resume is already highly optimized, give it a high Initial Score (e.g., 92, 95, 98). Do not feel capable of finding faults if the keyword match is exact.**

    **Score Breakdown Instructions**:
    Provide a granular score (0-100) for the following dimensions to help the user understand their rating:
    - **keywordMatch**: Presence of specific hard skills and software from the JD.
    - **experienceLevel**: Alignment with required years of experience and seniority.
    - **skillsMatch**: Depth and quality of technical capabilities.
    - **industryKnowledge**: Usage of correct industry terminology and relevance of background.
    - **explanation**: A concise (1-2 sentences) explanation of why the initial score was given.

    **Tailoring Task**:
    Your goal is to bridge the gap between the \`initialMatchScore\` and a \`projectedMatchScore\` of 95+.
    
    **Instructions for Output Fields**:
    1.  **suggestedSessionName**: Extract the primary job title and company name from the job description (e.g., "Senior React Dev @ Google").
    2.  **initialMatchScore**: The objective score calculated using the rubric above.
    3.  **projectedMatchScore**: The score achievable if *all* your suggestions are applied. This should typically be 95-100.
    4.  **scoreBreakdown**: Object containing the granular scores and explanation defined above.
    
    **Instructions for Suggestions**:
    - **additions**: Provide exact bullet points containing missing keywords.
    - **removals**: Remove irrelevant info that dilutes the keyword density.
    - **replacements**: Rewrite vague bullets to include metrics and exact JD terminology.
    - **Mandatory Summary Update**: You must rewrite the Professional Summary to perfectly align with this specific role.
    
    **"Must-Have" Skill Integration**:
    If a critical skill (e.g., "Python", "Project Management") is in the JD but missing or weak in the resume, you must suggest adding it in the Skills section AND the Work Experience section.

    Resume Content:
    ---
    ${resumeText}
    ---

    Job Description:
    ---
    ${jobDescription}
    ---
  `;
  
  const suggestionSchema = {
      type: Type.OBJECT,
      properties: {
        section: { type: Type.STRING, description: "The resume section this suggestion applies to (e.g., 'Experience', 'Skills', 'Summary')." },
        suggestion: { type: Type.STRING, description: "For additions, this is the exact bullet point to add. For removals, this is the content to be removed." },
        reason: { type: Type.STRING, description: "A brief explanation of why this addition or removal is recommended." }
      },
      required: ["section", "suggestion", "reason"]
  };

  const replacementSchema = {
      type: Type.OBJECT,
      properties: {
          section: { type: Type.STRING, description: "The resume section this suggestion applies to." },
          original: { type: Type.STRING, description: "The original text from the resume to be replaced." },
          replacement: { type: Type.STRING, description: "The suggested new text." },
          reason: { type: Type.STRING, description: "A brief explanation of why this replacement is recommended." }
      },
      required: ["section", "original", "replacement", "reason"]
  };

  const scoreBreakdownSchema = {
      type: Type.OBJECT,
      properties: {
          keywordMatch: { type: Type.NUMBER, description: "0-100 score for keyword presence." },
          experienceLevel: { type: Type.NUMBER, description: "0-100 score for seniority alignment." },
          skillsMatch: { type: Type.NUMBER, description: "0-100 score for technical skills." },
          industryKnowledge: { type: Type.NUMBER, description: "0-100 score for industry relevance." },
          explanation: { type: Type.STRING, description: "Brief explanation of the scoring." }
      },
      required: ["keywordMatch", "experienceLevel", "skillsMatch", "industryKnowledge", "explanation"]
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedSessionName: {
            type: Type.STRING,
            description: "A suggested name for the analysis session, formatted as 'Job Title @ Company'."
          },
          initialMatchScore: {
            type: Type.NUMBER,
            description: "A score from 0-100 indicating the initial match based on keyword presence."
          },
          projectedMatchScore: {
            type: Type.NUMBER,
            description: "A score from 0-100 for the resume *after* applying the suggestions."
          },
          scoreBreakdown: scoreBreakdownSchema,
          additions: {
            type: Type.ARRAY,
            description: "An array of exact bullet points or skills to add directly to the resume.",
            items: suggestionSchema,
          },
          removals: {
            type: Type.ARRAY,
            description: "Outdated, irrelevant, or weak phrases/points to remove.",
            items: suggestionSchema
          },
          replacements: {
            type: Type.ARRAY,
            description: "Vague statements to be replaced with stronger, more quantified achievements.",
            items: replacementSchema
          }
        },
        required: ["suggestedSessionName", "initialMatchScore", "projectedMatchScore", "scoreBreakdown", "additions", "removals", "replacements"],
      },
    },
  });

  const jsonText = (response.text || "{}").trim();
  try {
    return JSON.parse(jsonText) as TailoredSuggestions & { suggestedSessionName: string };
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", jsonText);
    throw new Error("Invalid JSON response from the API.");
  }
};

const getScreeningPrep = async (
  resumeText: string, 
  jobDescription: string,
  suggestions: TailoredSuggestions | null
): Promise<ScreeningPrepItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const prompt = `
    As an expert career coach, your task is to prepare a job candidate for a recruiter screening call. You will be given their resume, a job description, and optionally, a set of AI-powered suggestions for improving the resume.

    **Primary Goal**: Generate answers as if the candidate is speaking about the *final, improved version* of their resume.

    **Conditional Logic**:
    - **IF suggestions are provided**: You MUST base your answers on the resume *after* applying the given additions, removals, and replacements. This represents the stronger, tailored resume the candidate will submit.
    - **IF suggestions are NOT provided**: Base your answers on the original resume text.

    Your process should be:
    1. Based on the job description and the most relevant version of the resume (original or improved), generate a list of 10-15 realistic screening call questions a recruiter would likely ask.
    2. For each question, identify the key skills, technologies, or tools mentioned in the question itself. These will be used for highlighting.
    3. For each question, craft an ideal, compelling answer from the candidate's perspective.
    
    Guidelines for Answers:
    - **Tone**: The answers should be professional, confident, and conversational, as if spoken naturally during a phone call.
    - **Content**: Answers must directly leverage the skills and experiences from the most relevant resume version.
    - **"Tell me about yourself"**: This answer should be a concise "elevator pitch" connecting the candidate's background to the key requirements of the role.
    
    Original Resume:
    ---
    ${resumeText}
    ---

    Job Description:
    ---
    ${jobDescription}
    ---

    ${suggestions ? `
    AI Suggestions for Resume Improvement (Use this to inform the answers):
    ---
    ${JSON.stringify(suggestions, null, 2)}
    ---
    ` : ''}

    Provide the final output as a JSON array of objects.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: "The screening question a recruiter would ask."
            },
            answer: {
              type: Type.STRING,
              description: "The ideal, conversational answer from the candidate's perspective, based on their resume."
            },
            keywords: {
              type: Type.ARRAY,
              description: "A list of key skills, technologies, or tools mentioned in the question itself.",
              items: { type: Type.STRING }
            }
          },
          required: ["question", "answer", "keywords"]
        }
      }
    }
  });

  const jsonText = (response.text || "[]").trim();
  try {
    return JSON.parse(jsonText) as ScreeningPrepItem[];
  } catch (e) {
    console.error("Failed to parse Gemini response for screening prep:", jsonText);
    throw new Error("Invalid JSON response from the API for screening prep.");
  }
};

const getChatbotAnswer = async (
  resumeText: string,
  jobDescription: string,
  suggestions: TailoredSuggestions | null,
  conversationHistory: ChatMessage[],
  userQuestion: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const history = conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');

  const prompt = `
    You are an expert career coach conducting a mock interview. Your goal is to help a candidate practice for their screening call.

    You have the following context:
    1.  The candidate's original resume.
    2.  The job description they are applying for.
    3.  A set of AI suggestions to improve the resume. If these are present, the candidate's answers should reflect the *improved* resume.
    4.  The recent conversation history.

    The candidate has just asked a new question. Your task is to provide a helpful, conversational, and encouraging answer from the candidate's perspective, as if you were coaching them on what to say.

    **Candidate's Question:** "${userQuestion}"

    **Instructions:**
    - **Base your answer on the strongest version of the resume.** If AI suggestions are provided, formulate the answer based on the resume *with those improvements applied*. Otherwise, use the original resume.
    - **Be clear and effective.** Your answers should be comprehensive but not overly verbose. Aim for a natural, conversational length suitable for a phone interview.
    - Keep the tone professional, confident, and natural for a phone interview.
    - Provide the ideal response the *candidate* should give. Do not speak as the AI. Frame the answer as if the candidate is speaking.

    **Conversation History:**
    ---
    ${history}
    ---

    **Original Resume:**
    ---
    ${resumeText}
    ---
    
    ${suggestions ? `
    **AI Suggestions for Resume Improvement (Use this to inform the answers):**
    ---
    ${JSON.stringify(suggestions, null, 2)}
    ---
    ` : ''}

    **Job Description:**
    ---
    ${jobDescription}
    ---

    Now, provide the ideal answer for the candidate to their question: "${userQuestion}"
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
};

const getCoverLetter = async (
  resumeText: string,
  jobDescription: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const prompt = `
    You are an expert career consultant and professional resume writer.
    Write a compelling, professional cover letter for the candidate based on the provided resume and job description.

    **Guidelines:**
    1.  **Header:** Include placeholders for [Your Name], [Your Address], [Date], [Hiring Manager Name], [Company Address] if specific details aren't in the input.
    2.  **Introduction:** clearly state the position being applied for and express strong interest.
    3.  **Body Paragraphs:** Connect the candidate's specific achievements and skills (from the resume) directly to the key requirements listed in the job description. Use specific metrics where available.
    4.  **Tone:** Professional, enthusiastic, and confident.
    5.  **Closing:** Reiterate interest and request an interview.
    6.  **Format:** Return ONLY the text of the cover letter. Do not include markdown formatting like \`\`\` or extra conversational text.

    **Resume:**
    ---
    ${resumeText}
    ---

    **Job Description:**
    ---
    ${jobDescription}
    ---
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
  });

  return response.text || "";
};

export { getResumeSuggestions, getScreeningPrep, getChatbotAnswer, getCoverLetter };
