-- Add period bundle flag to deliverables
ALTER TABLE deliverables ADD COLUMN is_period_bundle BOOLEAN DEFAULT true;

-- Create deliverable_items table
CREATE TABLE deliverable_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  plan_item_id UUID REFERENCES plan_items(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliverable_items_deliverable ON deliverable_items(deliverable_id);
CREATE INDEX idx_deliverable_items_plan_item ON deliverable_items(plan_item_id);

-- Add optional item_id to deliverable_files so files can be linked to specific items
ALTER TABLE deliverable_files ADD COLUMN item_id UUID REFERENCES deliverable_items(id) ON DELETE SET NULL;

-- Delete all existing deliverables (cascade deletes files, comments)
DELETE FROM deliverables;
