CREATE TABLE IF NOT EXISTS wall_marks (
 id uuid PRIMARY KEY,
 entry jsonb NOT NULL,
 x double precision NOT NULL,
 y double precision NOT NULL,
 owner_hash text NOT NULL,
 visitor_hash text NOT NULL,
 status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wall_marks_viewport ON wall_marks (x,y) WHERE status='visible';
CREATE INDEX IF NOT EXISTS wall_marks_rate ON wall_marks (visitor_hash,created_at);
CREATE TABLE IF NOT EXISTS wall_reports (
 mark_id uuid NOT NULL REFERENCES wall_marks(id) ON DELETE CASCADE,
 visitor_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (mark_id,visitor_hash)
);
CREATE INDEX IF NOT EXISTS wall_reports_rate ON wall_reports(visitor_hash,created_at);
CREATE TABLE IF NOT EXISTS wall_submissions (
 visitor_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wall_submissions_rate ON wall_submissions(visitor_hash,created_at);
