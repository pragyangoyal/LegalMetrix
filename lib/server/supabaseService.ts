import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { FullInspectionDetail, InspectionRecord } from './inspectionService';

/**
 * Save / sync full inspection record to Supabase
 */
export async function syncInspectionToSupabase(detail: FullInspectionDetail): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }

  try {
    // 1. Upsert inspection record
    const { error: inspError } = await supabase
      .from('inspections')
      .upsert({
        id: detail.id,
        created_at: detail.created_at,
        updated_at: detail.updated_at,
        status: detail.status,
        scan_mode: detail.scan_mode,
        product_name: detail.product_name,
        compliance_score: detail.compliance_score,
        overall_status: detail.overall_status,
        raw_ocr_text: detail.raw_ocr_text,
        ai_summary: detail.ai_summary,
        processing_time_ms: detail.processing_time_ms,
        images_count: detail.images_count,
        images_analyzed: detail.images_analyzed,
        demo_product_id: detail.demo_product_id,
      });

    if (inspError) {
      console.warn('Supabase inspection sync warning:', inspError.message);
      return false;
    }

    // 2. Sync images if any
    if (detail.images && detail.images.length > 0) {
      const imagesToUpsert = detail.images.map((img) => ({
        id: img.id,
        inspection_id: detail.id,
        filename: img.filename,
        original_name: img.original_name,
        mime_type: img.mime_type,
        size_bytes: img.size_bytes,
        image_order: img.image_order,
        label: img.label,
        file_path: img.file_path,
        status: img.status,
        ocr_text: img.ocr_text,
        ocr_confidence: img.ocr_confidence,
        processing_time_ms: img.processing_time_ms,
        created_at: img.created_at,
      }));

      await supabase.from('inspection_images').upsert(imagesToUpsert);
    }

    // 3. Sync extracted fields
    if (detail.fieldRecords && detail.fieldRecords.length > 0) {
      const fieldsToUpsert = detail.fieldRecords.map((f) => ({
        id: f.id,
        inspection_id: detail.id,
        field_name: f.field_name,
        value: f.value,
        confidence: f.confidence,
        source_image_id: f.source_image_id,
        status: f.status,
      }));

      await supabase.from('extracted_fields').upsert(fieldsToUpsert);
    }

    // 4. Sync compliance checks
    if (detail.checks && detail.checks.length > 0) {
      const checksToUpsert = detail.checks.map((c) => ({
        id: c.id,
        inspection_id: detail.id,
        rule_id: c.rule_id,
        rule_name: c.rule_name,
        category: c.category,
        severity: c.severity,
        status: c.status,
        message: c.message,
        evidence: c.evidence,
        explanation: c.explanation,
        confidence: c.confidence,
        score_earned: c.score_earned,
        max_score: c.max_score,
      }));

      await supabase.from('compliance_checks').upsert(checksToUpsert);
    }

    return true;
  } catch (err) {
    console.warn('Supabase sync error (check if tables exist):', err);
    return false;
  }
}

/**
 * Fetch inspections list from Supabase
 */
export async function fetchInspectionsFromSupabase(options?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<InspectionRecord[] | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    let query = supabase
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.status && options.status !== 'ALL') {
      query = query.eq('overall_status', options.status);
    }

    if (options?.search) {
      query = query.or(`product_name.ilike.%${options.search}%,id.ilike.%${options.search}%`);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }

    return data as InspectionRecord[];
  } catch (err) {
    console.warn('Supabase fetch exception:', err);
    return null;
  }
}

/**
 * Delete inspection from Supabase
 */
export async function deleteInspectionFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase.from('inspections').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}
