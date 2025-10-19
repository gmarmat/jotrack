import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';

/**
 * PUT - Update person's LinkedIn text and optimization status
 * Body: { personId, rawText?, isOptimized? }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { personId, rawText, isOptimized } = await request.json();
    
    if (!personId) {
      return NextResponse.json(
        { error: 'personId is required' },
        { status: 400 }
      );
    }

    console.log(`📝 Updating person ${personId}...`);
    
    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    
    if (rawText !== undefined) {
      updates.push('raw_text = ?');
      values.push(rawText);
    }
    
    if (isOptimized !== undefined) {
      updates.push('is_optimized = ?');
      values.push(isOptimized);
      
      // If setting to unoptimized, clear the extracted data
      if (isOptimized === 0) {
        updates.push('summary = NULL, optimized_at = NULL');
      }
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    // Add updatedAt
    updates.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));
    
    // Add personId for WHERE clause
    values.push(personId);
    
    const query = `
      UPDATE people_profiles 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;
    
    console.log('📝 Update query:', query);
    console.log('📝 Values:', values);
    
    const result = sqlite.prepare(query).run(...values);
    
    console.log(`✅ Updated person ${personId}:`, {
      changes: result.changes,
      rawText: rawText ? `${rawText.length} chars` : 'not updated',
      isOptimized: isOptimized !== undefined ? isOptimized : 'not updated'
    });

    return NextResponse.json({
      success: true,
      changes: result.changes
    });
  } catch (error: any) {
    console.error('❌ PUT /people/update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update person' },
      { status: 500 }
    );
  }
}
