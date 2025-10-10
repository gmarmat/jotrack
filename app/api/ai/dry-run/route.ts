import { NextRequest } from "next/server";

/**
 * AI Dry-Run Endpoint
 * 
 * Provides deterministic, stubbed responses for AI analyzers
 * NO external network calls by default
 * Privacy-first architecture
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const analyzer = body?.analyzer ?? "none";

    // Gate is server-side OFF by default; never calls out
    const response = {
      ok: true,
      gate: "off-by-default",
      analyzer,
      sample: getSampleOutput(analyzer),
      timestamp: new Date().toISOString(),
      note: "Deterministic output - no external API calls",
    };

    return Response.json(response);
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: "Failed to process dry-run request",
      },
      { status: 500 }
    );
  }
}

function getSampleOutput(analyzer: string) {
  switch (analyzer) {
    case "jd_vs_resume":
      return {
        score: 0.73,
        highlights: [
          "Strong keyword match for 'React' and 'TypeScript'",
          "Skills overlap: Full-stack development",
          "Experience level aligns with requirements",
        ],
        gaps: [
          "Missing: 5 years experience requirement",
          "No mention of AWS/cloud infrastructure",
          "Limited leadership experience mentioned",
        ],
      };
    
    case "resume_summary":
      return {
        summary: "Senior Software Engineer with 3+ years experience in React, TypeScript, and Node.js. Strong background in building scalable web applications.",
        keySkills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
        experience: "3 years",
      };

    case "cover_letter_feedback":
      return {
        score: 0.81,
        strengths: [
          "Clear articulation of relevant experience",
          "Specific examples of past achievements",
        ],
        improvements: [
          "Could mention company-specific knowledge",
          "Add quantifiable metrics to achievements",
        ],
      };

    default:
      return {
        score: 0.5,
        message: "Unknown analyzer type - returning default sample data",
      };
  }
}

