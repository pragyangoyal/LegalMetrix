-- ==============================================================================
-- LegalMetrix Supabase Schema
-- Copy and paste this entire script into your Supabase Dashboard:
-- Supabase -> SQL Editor (in the left sidebar) -> "+ New Query" -> Click "Run"
-- ==============================================================================

-- 1. Inspections Table
CREATE TABLE IF NOT EXISTS public.inspections (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'UPLOADED',
  scan_mode TEXT NOT NULL DEFAULT 'upload',
  product_name TEXT,
  compliance_score INTEGER,
  overall_status TEXT,
  raw_ocr_text TEXT,
  ai_summary TEXT,
  processing_time_ms INTEGER DEFAULT 0,
  images_count INTEGER DEFAULT 0,
  images_analyzed INTEGER DEFAULT 0,
  demo_product_id TEXT
);

-- 2. Inspection Images Table
CREATE TABLE IF NOT EXISTS public.inspection_images (
  id TEXT PRIMARY KEY,
  inspection_id TEXT NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  image_order INTEGER NOT NULL DEFAULT 0,
  label TEXT,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  ocr_text TEXT,
  ocr_confidence REAL,
  processing_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Extracted Fields Table
CREATE TABLE IF NOT EXISTS public.extracted_fields (
  id TEXT PRIMARY KEY,
  inspection_id TEXT NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence REAL DEFAULT 0.0,
  source_image_id TEXT,
  status TEXT NOT NULL DEFAULT 'DETECTED'
);

-- 4. Compliance Checks Table
CREATE TABLE IF NOT EXISTS public.compliance_checks (
  id TEXT PRIMARY KEY,
  inspection_id TEXT NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  evidence TEXT,
  explanation TEXT,
  confidence REAL DEFAULT 0.0,
  score_earned INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON public.inspections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_overall_status ON public.inspections(overall_status);
CREATE INDEX IF NOT EXISTS idx_inspection_images_inspection_id ON public.inspection_images(inspection_id);
CREATE INDEX IF NOT EXISTS idx_extracted_fields_inspection_id ON public.extracted_fields(inspection_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_inspection_id ON public.compliance_checks(inspection_id);

-- 6. Enable Row Level Security (RLS) & Allow Read/Write
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on inspections" ON public.inspections;
CREATE POLICY "Allow all on inspections" ON public.inspections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on inspection_images" ON public.inspection_images;
CREATE POLICY "Allow all on inspection_images" ON public.inspection_images FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on extracted_fields" ON public.extracted_fields;
CREATE POLICY "Allow all on extracted_fields" ON public.extracted_fields FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on compliance_checks" ON public.compliance_checks;
CREATE POLICY "Allow all on compliance_checks" ON public.compliance_checks FOR ALL USING (true) WITH CHECK (true);
