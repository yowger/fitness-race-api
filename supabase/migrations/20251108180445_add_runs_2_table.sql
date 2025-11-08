-- RUNS
CREATE TABLE runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    distance NUMERIC CHECK (distance > 0),
    time NUMERIC CHECK (time >= 0),
    pace TEXT,
    route JSONB NOT NULL,
    map_image TEXT,
    start_address TEXT,
    end_address TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_runs_user_created_at ON runs (created_by, created_at DESC);
