-- lib/migrations/017_fix_deliverable_comments_constraint.sql
-- Make user_id nullable in deliverable_comments and add ON DELETE SET NULL behavior

ALTER TABLE deliverable_comments
DROP CONSTRAINT IF EXISTS deliverable_comments_user_id_fkey;

ALTER TABLE deliverable_comments
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE deliverable_comments
ADD CONSTRAINT deliverable_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
