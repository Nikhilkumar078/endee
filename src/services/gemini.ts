import { GoogleGenAI, Type } from "@google/genai";
import { InterviewMode, Question, Evaluation, PrepPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const InterviewerAgent = {
  async generateQuestion(
    mode: InterviewMode,
    history: Question[],
    resumeData?: string,
    weaknesses?: string[],
    company?: string
  ): Promise<string> {
    const model = "gemini-3.1-pro-preview";
    const prompt = `
      You are an expert Interviewer Agent. 
      Mode: ${mode}
      Company: ${company || "General"}
      Resume Context: ${resumeData || "None"}
      User Weaknesses: ${weaknesses?.join(", ") || "None"}
      Interview History: ${JSON.stringify(history.map(h => h.question))}

      Task: Generate the next interview question. 
      - If it's the first question, start with an introduction or a basic question.
      - If history exists, make it adaptive. If the user struggled with a topic (weakness), ask a clarifying or slightly easier question. If they did well, ask a more advanced one.
      - For "Technical" mode, focus on coding, system design, or domain knowledge.
      - For "HR" mode, focus on behavioral and cultural fit.
      - For "Rapid Fire", keep it short and punchy.
      - For "Company-specific", use known patterns for ${company}.

      Return ONLY the question text.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Could you tell me more about your background?";
  }
};

export const EvaluatorAgent = {
  async evaluateAnswer(question: string, answer: string): Promise<{ feedback: string; score: number; emotion: string }> {
    const model = "gemini-3-flash-preview";
    const prompt = `
      You are an expert Evaluator Agent.
      Question: ${question}
      User Answer: ${answer}

      Task: Evaluate the answer.
      Provide:
      1. Constructive feedback (what was good, what was missing).
      2. A score from 0 to 10.
      3. Detected emotion (e.g., "Confident", "Nervous", "Hesitant") based on the text structure and keywords.

      Return the response in JSON format:
      {
        "feedback": "string",
        "score": number,
        "emotion": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING },
            score: { type: Type.NUMBER },
            emotion: { type: Type.STRING }
          },
          required: ["feedback", "score", "emotion"]
        }
      }
    });

    return JSON.parse(response.text || '{"feedback": "No feedback available", "score": 0, "emotion": "Neutral"}');
  }
};

export const CoachAgent = {
  async getOverallEvaluation(history: Question[]): Promise<Evaluation> {
    const model = "gemini-3-flash-preview";
    const prompt = `
      You are an expert Career Coach Agent.
      Interview History: ${JSON.stringify(history)}

      Task: Provide an overall evaluation of the interview.
      Score the user on:
      1. Communication (0-10)
      2. Technical Accuracy (0-10)
      3. Confidence (0-10)
      4. Hireability Score (0-100)
      Provide a summary of their performance, key strong areas, weak areas, and actionable suggestions.

      Return the response in JSON format:
      {
        "communication": number,
        "technical": number,
        "confidence": number,
        "hireability": number,
        "summary": "string",
        "strongAreas": ["string"],
        "weakAreas": ["string"],
        "suggestions": ["string"]
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            communication: { type: Type.NUMBER },
            technical: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            hireability: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            strongAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            weakAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["communication", "technical", "confidence", "hireability", "summary", "strongAreas", "weakAreas", "suggestions"]
        }
      }
    });

    return JSON.parse(response.text || '{"communication": 0, "technical": 0, "confidence": 0, "hireability": 0, "summary": "N/A", "strongAreas": [], "weakAreas": [], "suggestions": []}');
  }
};

export const PlanningAgent = {
  async generatePlan(target: string, duration: number, weaknesses: string[]): Promise<PrepPlan['plan']> {
    const model = "gemini-3-flash-preview";
    const prompt = `
      You are a Planning Agent.
      Target: ${target}
      Duration: ${duration} days
      Weaknesses: ${weaknesses.join(", ")}

      Task: Generate a day-wise preparation plan.
      Return a list of objects, one for each day.

      Return the response in JSON format:
      [
        {
          "day": number,
          "topics": ["string"],
          "tasks": ["string"]
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.NUMBER },
              topics: { type: Type.ARRAY, items: { type: Type.STRING } },
              tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["day", "topics", "tasks"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  }
};

export const ResumeAnalyzer = {
  async analyze(text: string): Promise<{ 
    skills: string[]; 
    projects: string[]; 
    summary: string;
    atsScore: number;
    atsSuggestions: string[];
  }> {
    const model = "gemini-3-flash-preview";
    const prompt = `
      Analyze this resume text:
      ${text}

      Extract:
      1. Key skills.
      2. Major projects.
      3. A brief summary of the candidate's profile.
      4. ATS Friendliness Score (0-100).
      5. Specific suggestions to make it more ATS-friendly (e.g., formatting, keywords, section headers).

      Return the response in JSON format:
      {
        "skills": ["string"],
        "projects": ["string"],
        "summary": "string",
        "atsScore": number,
        "atsSuggestions": ["string"]
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            projects: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            atsScore: { type: Type.NUMBER },
            atsSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["skills", "projects", "summary", "atsScore", "atsSuggestions"]
        }
      }
    });

    return JSON.parse(response.text || '{"skills": [], "projects": [], "summary": "", "atsScore": 0, "atsSuggestions": []}');
  }
};

export const JobSearchAgent = {
  async searchJobs(query: string): Promise<any[]> {
    const model = "gemini-3-flash-preview";
    const prompt = `
      Search for real job openings in India based on the query: "${query}".
      Find at least 4-6 current job listings.
      For each job, provide:
      1. Job Title
      2. Company Name
      3. Location (City in India)
      4. Job Type (Full-time, Remote, Hybrid, etc.)
      5. Estimated Salary (in INR Lakhs per annum, e.g., "₹15L - ₹25L")
      6. AI Match Score (a percentage from 70-98 based on relevance to "${query}")
      7. Application URL (The actual link to the job posting or company careers page)

      Return the response in JSON format:
      [
        {
          "title": "string",
          "company": "string",
          "location": "string",
          "type": "string",
          "salary": "string",
          "match": number,
          "url": "string"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              type: { type: Type.STRING },
              salary: { type: Type.STRING },
              match: { type: Type.NUMBER },
              url: { type: Type.STRING }
            },
            required: ["title", "company", "location", "type", "salary", "match", "url"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse job search results", e);
      return [];
    }
  }
};
