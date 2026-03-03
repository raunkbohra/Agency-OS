ALTER TABLE deliverable_comments ADD COLUMN item_id UUID REFERENCES deliverable_items(id) ON DELETE SET NULL;
CREATE INDEX idx_deliverable_comments_item ON deliverable_comments(item_id);
