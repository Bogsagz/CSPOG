-- Create unique partial index to ensure only one mentor per workstream
CREATE UNIQUE INDEX unique_mentor_per_workstream 
ON profiles (workstream) 
WHERE primary_role = 'mentor' AND workstream IS NOT NULL;