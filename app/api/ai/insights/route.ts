import { NextRequest } from "next/server";
import { aiEnabled, getSessionKey } from "@/app/lib/aiGate";
import { extractFileContent } from "@/lib/fileContent";

/**
 * POST /api/ai/insights
 * 
 * Generate AI insights for a job/status
 * Two modes:
 * 1. Dry-run (default, local): Deterministic, no network
 * 2. Real (if enabled + key): Actual AI analysis
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, status, mode = "dry-run", resumePath, jdPath } = body;

    // Check if AI is enabled (client-side localStorage check would be done in UI)
    // Server always starts in dry-run mode for safety
    const useDryRun = mode === "dry-run";

    if (useDryRun) {
      // Deterministic dry-run response
      return Response.json({
        ok: true,
        mode: "dry-run",
        insights: {
          score: 0.78,
          highlights: [
            "Strong technical skills match (React, TypeScript)",
            "Relevant industry experience mentioned",
            "Communication skills align with requirements",
          ],
          gaps: [
            "Could emphasize leadership experience more",
            "Missing specific AWS/cloud mentions",
          ],
          keywords: ["React", "TypeScript", "Leadership", "Communication", "Problem-solving"],
          summary: "Good overall match with room for tailored improvements.",
        },
        timestamp: Date.now(),
        note: "Dry-run mode - deterministic output, no API calls",
      });
    }

    // Real AI mode (future implementation)
    // Requires: AI enabled in settings + valid API key
    return Response.json({
      ok: false,
      error: "Real AI mode not yet implemented - use dry-run",
      mode: "dry-run-fallback",
    });

    /* Future real AI implementation:
    
    if (!aiEnabled()) {
      return Response.json(
        { error: "AI not enabled - check Settings" },
        { status: 403 }
      );
    }

    const apiKey = getSessionKey();
    if (!apiKey) {
      return Response.json(
        { error: "API key required" },
        { status: 401 }
      );
    }

    // Extract raw content from files
    const resumeContent = resumePath ? await extractFileContent(resumePath) : null;
    const jdContent = jdPath ? await extractFileContent(jdPath) : null;

    // Call OpenAI API
    const analysis = await callOpenAI(
      apiKey,
      resumeContent?.text,
      jdContent?.text,
      prompt
    );

    return Response.json({
      ok: true,
      mode: "real",
      insights: analysis,
      timestamp: Date.now(),
    });
    */
  } catch (error) {
    console.error("AI insights error:", error);
    return Response.json(
      { error: "Insight generation failed" },
      { status: 500 }
    );
  }
}

