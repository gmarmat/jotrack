/**
 * Tavily Web Search Integration
 * Real-time web search for company intelligence
 */

import { getAiSettings } from '@/lib/coach/aiProvider';

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export interface TavilyResponse {
  success: boolean;
  results?: TavilySearchResult[];
  error?: string;
  searchesUsed?: number;
}

/**
 * Search the web using Tavily API
 */
export async function searchWeb(query: string, options?: {
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
}): Promise<TavilyResponse> {
  try {
    // Get Tavily API key from settings
    const settings = await getAiSettings();
    const tavilyKey = settings.tavilyKey;
    
    if (!tavilyKey) {
      console.warn('⚠️ No Tavily key configured - skipping web search');
      return {
        success: false,
        error: 'No Tavily API key configured. Add it in Settings → AI & Privacy for real-time web search.',
      };
    }
    
    console.log(`🌐 Tavily search: "${query.slice(0, 50)}..."`);
    
    // ⏱️ CRITICAL: Add 30s timeout for web search
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second max for search
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyKey,
        query,
        max_results: options?.maxResults || 5,
        search_depth: options?.searchDepth || 'advanced',
        include_answer: false,
        include_raw_content: false,
        include_images: false,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Tavily returned ${data.results?.length || 0} results`);
    
    return {
      success: true,
      results: data.results || [],
      searchesUsed: 1,
    };
  } catch (error: any) {
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      console.error('❌ Tavily search timed out after 30 seconds');
      return {
        success: false,
        error: 'Web search timed out after 30 seconds. Please try again.',
      };
    }
    
    console.error('❌ Tavily search failed:', error.message);
    return {
      success: false,
      error: error.message || 'Web search failed',
    };
  }
}

/**
 * Format search results for AI consumption
 */
export function formatSearchResultsForPrompt(results: TavilySearchResult[]): string {
  if (!results || results.length === 0) {
    return 'No web search results available.';
  }
  
  return results.map((result, idx) => `
[Source ${idx + 1}] ${result.title}
URL: ${result.url}
Published: ${result.published_date || 'Unknown'}
Relevance: ${(result.score * 100).toFixed(0)}%

${result.content}

---
  `).join('\n');
}

