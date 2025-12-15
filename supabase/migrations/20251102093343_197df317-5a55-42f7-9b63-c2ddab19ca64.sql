-- Add due_date column to user_deliverables table
ALTER TABLE user_deliverables 
ADD COLUMN due_date date;

-- Add an index for better performance when filtering by due date
CREATE INDEX idx_user_deliverables_due_date ON user_deliverables(due_date) WHERE due_date IS NOT NULL;