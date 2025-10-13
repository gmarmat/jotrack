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

    // v1.3.1: Real AI mode implementation
    try {
      const { callAiProvider } = await import('@/lib/coach/aiProvider');
      const { sqlite } = await import('@/db/client');
      
      // Get job data
      const jobRows = sqlite.prepare('SELECT * FROM jobs WHERE id = ? LIMIT 1').all(jobId);
      if (!jobRows || jobRows.length === 0) {
        return Response.json({
          ok: false,
          error: "Job not found",
        }, { status: 404 });
      }
      const job = jobRows[0] as any;

      // Get attachments to extract JD and Resume
      const attachmentRows = sqlite.prepare('SELECT * FROM attachments WHERE job_id = ? AND deleted_at IS NULL').all(jobId) as Array<{
        id: string;
        job_id: string;
        kind: string;
        path: string;
        filename: string;
      }>;
      const jdAttachment = attachmentRows.find((a) => a.kind === 'jd');
      const resumeAttachment = attachmentRows.find((a) => a.kind === 'resume');
      
      let jdText = '';
      let resumeText = '';
      
      if (jdAttachment?.path) {
        // Path in DB is relative to data/attachments/
        const fullPath = `data/attachments/${jdAttachment.path}`;
        const jdContent = await extractFileContent(fullPath);
        jdText = jdContent?.text || '';
      }
      
      if (resumeAttachment?.path) {
        // Path in DB is relative to data/attachments/
        const fullPath = `data/attachments/${resumeAttachment.path}`;
        const resumeContent = await extractFileContent(fullPath);
        resumeText = resumeContent?.text || '';
      }

      // Call AI provider with fit analysis
      const { result } = await callAiProvider(
        'compare',
        {
          jobTitle: job.title,
          company: job.company,
          jdText: jdText || job.notes || 'No job description available',
          resumeText: resumeText || 'No resume available',
          notesText: job.notes || '',
        },
        false, // Remote mode
        'v1'
      );

      // Transform result to insights format
      const insights = {
        score: result.fit?.overall || 0,
        highlights: result.fit?.breakdown
          ?.filter((b: any) => b.score >= 0.7)
          .slice(0, 3)
          .map((b: any) => b.parameter) || [],
        gaps: result.fit?.breakdown
          ?.filter((b: any) => b.score < 0.5)
          .slice(0, 2)
          .map((b: any) => b.parameter) || [],
        keywords: result.keywords?.slice(0, 5).map((k: any) => k.term) || [],
        summary: `Overall fit: ${Math.round((result.fit?.overall || 0) * 100)}%. Analysis based on ${result.sources?.length || 0} sources.`,
      };

      return Response.json({
        ok: true,
        mode: "remote",
        insights,
        timestamp: Date.now(),
        note: "Real AI analysis using OpenAI",
      });
    } catch (error) {
      console.error("Real AI mode error:", error);
      // Fallback to dry-run on error
      return Response.json({
        ok: true,
        mode: "dry-run-fallback",
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
        note: "Fallback to dry-run due to error: " + (error instanceof Error ? error.message : 'Unknown error'),
      });
    }

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

