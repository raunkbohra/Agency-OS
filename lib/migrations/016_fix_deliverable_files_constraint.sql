-- lib/migrations/016_fix_deliverable_files_constraint.sql
-- Make uploaded_by nullable and add ON DELETE SET NULL behavior

ALTER TABLE deliverable_files
DROP CONSTRAINT IF EXISTS deliverable_files_uploaded_by_fkey;

ALTER TABLE deliverable_files
ALTER COLUMN uploaded_by DROP NOT NULL;

ALTER TABLE deliverable_files
ADD CONSTRAINT deliverable_files_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;
