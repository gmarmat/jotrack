// v2.7: Core extraction engine

import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';
import { db } from '@/db/client';
import { artifactVariants, extractionQueue } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import type {
  VariantType,
  SourceType,
  ExtractionResult,
  ExtractionOptions,
  IExtractor,
} from './types';

// Registry of extractors
const extractors = new Map<SourceType, IExtractor>();

export function registerExtractor(sourceType: SourceType, extractor: IExtractor) {
  extractors.set(sourceType, extractor);
}

export function getExtractor(sourceType: SourceType): IExtractor {
  const extractor = extractors.get(sourceType);
  if (!extractor) {
    throw new Error(`No extractor registered for source type: ${sourceType}`);
  }
  return extractor;
}

/**
 * Check if variants already exist for this source with the same content hash
 */
async function checkExistingVariants(
  sourceId: string,
  sourceType: SourceType,
  contentHash: string
): Promise<{ allPresent: boolean; variantIds: string[] }> {
  const existing = await db
    .select()
    .from(artifactVariants)
    .where(
      and(
        eq(artifactVariants.sourceId, sourceId),
        eq(artifactVariants.sourceType, sourceType),
        eq(artifactVariants.contentHash, contentHash),
        eq(artifactVariants.isActive, true)
      )
    );

  const expectedTypes: VariantType[] = ['ui', 'ai_optimized', 'detailed'];
  const existingTypes = new Set(existing.map((v) => v.variantType));
  const allPresent = expectedTypes.every((type) => existingTypes.has(type));

  return {
    allPresent,
    variantIds: existing.map((v) => v.id),
  };
}

/**
 * Queue an extraction job for async processing
 */
async function queueExtraction(
  sourceId: string,
  sourceType: SourceType,
  priority: number
): Promise<void> {
  const now = Date.now();
  const variantTypes: VariantType[] = ['ui', 'ai_optimized', 'detailed'];

  for (const variantType of variantTypes) {
    await db.insert(extractionQueue).values({
      id: uuid(),
      sourceId,
      sourceType,
      variantType,
      priority,
      status: 'queued',
      createdAt: now,
    });
  }
}

/**
 * Save a single variant to the database
 */
async function saveVariant(params: {
  sourceId: string;
  sourceType: SourceType;
  variantType: VariantType;
  content: any;
  contentHash: string;
  tokenCount?: number;
  extractionModel?: string;
}): Promise<string> {
  const variantId = uuid();
  const now = Date.now();

  // Deactivate previous versions of this variant
  await db
    .update(artifactVariants)
    .set({ isActive: false })
    .where(
      and(
        eq(artifactVariants.sourceId, params.sourceId),
        eq(artifactVariants.sourceType, params.sourceType),
        eq(artifactVariants.variantType, params.variantType)
      )
    );

  // Insert new variant
  await db.insert(artifactVariants).values({
    id: variantId,
    sourceId: params.sourceId,
    sourceType: params.sourceType,
    variantType: params.variantType,
    version: 1,
    content: JSON.stringify(params.content),
    contentHash: params.contentHash,
    tokenCount: params.tokenCount,
    extractionModel: params.extractionModel || 'mock',
    extractionPromptVersion: 'v1',
    createdAt: now,
    isActive: true,
  });

  return variantId;
}

/**
 * Main extraction orchestrator
 * Extracts content into 3 variants (ui, ai_optimized, detailed)
 */
export async function extractVariants(
  sourceId: string,
  sourceType: SourceType,
  rawContent: string,
  options?: ExtractionOptions
): Promise<{ variantIds: string[] }> {
  // Calculate content hash
  const contentHash = createHash('sha256').update(rawContent).digest('hex');

  // Check if variants already exist with same hash (skip re-extraction)
  const existing = await checkExistingVariants(sourceId, sourceType, contentHash);
  if (existing.allPresent) {
    console.log(`✅ Variants already exist for ${sourceType}:${sourceId}`);
    return { variantIds: existing.variantIds };
  }

  // Queue extraction job (async by default)
  if (options?.async !== false) {
    await queueExtraction(sourceId, sourceType, options?.priority || 5);
    console.log(`📥 Queued extraction for ${sourceType}:${sourceId}`);
    return { variantIds: [] }; // Will be populated async
  }

  // Synchronous extraction
  console.log(`🔄 Extracting variants for ${sourceType}:${sourceId}...`);
  const extractor = getExtractor(sourceType);
  const variants = await extractor.extract(sourceId, rawContent);

  // Save all 3 variants
  const variantIds: string[] = [];
  for (const [variantType, content] of Object.entries(variants)) {
    const variantId = await saveVariant({
      sourceId,
      sourceType,
      variantType: variantType as VariantType,
      content,
      contentHash,
      tokenCount: estimateTokens(JSON.stringify(content)),
      extractionModel: options?.model,
    });
    variantIds.push(variantId);
  }

  console.log(`✅ Extracted ${variantIds.length} variants for ${sourceType}:${sourceId}`);
  return { variantIds };
}

/**
 * Get specific variant (with fallback to raw)
 */
export async function getVariant(
  sourceId: string,
  sourceType: SourceType,
  variantType: VariantType
): Promise<any | null> {
  const results = await db
    .select()
    .from(artifactVariants)
    .where(
      and(
        eq(artifactVariants.sourceId, sourceId),
        eq(artifactVariants.sourceType, sourceType),
        eq(artifactVariants.variantType, variantType),
        eq(artifactVariants.isActive, true)
      )
    )
    .limit(1);

  if (results.length === 0) {
    // Fallback: try to get raw variant
    if (variantType !== 'raw') {
      return await getVariant(sourceId, sourceType, 'raw');
    }
    return null;
  }

  return JSON.parse(results[0].content);
}

/**
 * Get all variants for a source
 */
export async function getAllVariants(
  sourceId: string,
  sourceType: SourceType
): Promise<Record<VariantType, any>> {
  const results = await db
    .select()
    .from(artifactVariants)
    .where(
      and(
        eq(artifactVariants.sourceId, sourceId),
        eq(artifactVariants.sourceType, sourceType),
        eq(artifactVariants.isActive, true)
      )
    );

  const variants: Partial<Record<VariantType, any>> = {};
  for (const result of results) {
    variants[result.variantType] = JSON.parse(result.content);
  }

  return variants as Record<VariantType, any>;
}

/**
 * Simple token estimation (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

