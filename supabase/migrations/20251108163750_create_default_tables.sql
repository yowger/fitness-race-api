-- USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- ROUTES
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    distance NUMERIC,
    geojson JSONB,
    start_address TEXT,
    end_address TEXT,
    created_by UUID REFERENCES users(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT now()
);
-- RACES
CREATE TABLE IF NOT EXISTS races (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    route_id UUID REFERENCES routes(id) ON DELETE
    SET NULL,
        created_by UUID REFERENCES users(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT now()
);
-- RACE PARTICIPANTS (many-to-many between users and races)
CREATE TABLE IF NOT EXISTS race_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    total_distance NUMERIC DEFAULT 0,
    total_duration NUMERIC,
    rank INTEGER,
    status TEXT DEFAULT 'active',
    -- active, finished, disqualified
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (race_id, user_id)
);
-- LOCATIONS
CREATE TABLE IF NOT EXISTS locations (
    id BIGSERIAL PRIMARY KEY,
    participant_id UUID NOT NULL REFERENCES race_participants(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed NUMERIC,
    distance_from_start NUMERIC,
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_locations_participant_time ON locations (participant_id, timestamp DESC);
-- GROUP RACES
create table group_races (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    start_time timestamp not null,
    end_time timestamp,
    actual_start_time timestamp,
    actual_end_time timestamp,
    max_participants integer default 0,
    route_id uuid references routes(id) on delete
    set null,
        created_by uuid references users(id) on delete
    set null,
        status text not null default 'upcoming',
        created_at timestamp default now(),
        updated_at timestamp default now()
);
-- GROUP RACE PARTICIPANTS
create table race_participants (
    id uuid primary key default gen_random_uuid(),
    race_id uuid not null references group_races(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    bib_number INTEGER,
    joined_at timestamp default now(),
    unique(race_id, user_id)
);
-- GROUP RACE RESULTS
create table race_results (
    id uuid primary key default gen_random_uuid(),
    race_id uuid not null references group_races(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    finish_time BIGINT,
    position integer,
    recorded_at timestamp default now(),
    status text,
    unique(race_id, user_id)
);
-- GROUP RACE TRACKING / LOCATIONS
create table race_tracking (
    id uuid primary key default gen_random_uuid(),
    race_id uuid not null references group_races(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    latitude double precision not null,
    longitude double precision not null,
    recorded_at timestamp default now()
);