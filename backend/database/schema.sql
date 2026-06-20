-- =====================================================
-- TORRENT/MOVIE WEBSITE ADMIN PANEL
-- CORRECTED PostgreSQL Schema - NO SYNTAX ERRORS
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TMDB MOVIES TABLE
-- =====================================================

CREATE TABLE tmdb_movies (
    id BIGSERIAL PRIMARY KEY,
    tmdb_id INTEGER UNIQUE NOT NULL,
    imdb_id VARCHAR(20) UNIQUE,
    title VARCHAR(500) NOT NULL,
    original_title VARCHAR(500),
    overview TEXT,
    tagline VARCHAR(500),
    poster_path VARCHAR(500),
    backdrop_path VARCHAR(500),
    release_date DATE,
    runtime INTEGER,
    vote_average DECIMAL(3,1) DEFAULT 0,
    vote_count INTEGER DEFAULT 0,
    popularity DECIMAL(10,2) DEFAULT 0,
    budget BIGINT,
    revenue BIGINT,
    homepage VARCHAR(500),
    status VARCHAR(50),
    original_language VARCHAR(10),
    is_adult BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_runtime_positive CHECK (runtime IS NULL OR runtime > 0),
    CONSTRAINT check_vote_average_range CHECK (vote_average >= 0 AND vote_average <= 10)
);

-- =====================================================
-- 2. MOVIE TORRENTS TABLES
-- =====================================================

CREATE TABLE movie_qualities (
    id SERIAL PRIMARY KEY,
    quality_name VARCHAR(20) UNIQUE NOT NULL,
    resolution VARCHAR(10),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO movie_qualities (quality_name, resolution, sort_order) VALUES
    ('480p', '854x480', 1),
    ('720p', '1280x720', 2),
    ('1080p', '1920x1080', 3),
    ('2160p', '3840x2160', 4),
    ('4K', '3840x2160', 5)
ON CONFLICT (quality_name) DO NOTHING;

CREATE TABLE torrent_sources (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO torrent_sources (source_name) VALUES
    ('ThePirateBay'),
    ('RARBG'),
    ('1337x'),
    ('YTS'),
    ('TorrentGalaxy')
ON CONFLICT (source_name) DO NOTHING;

CREATE TABLE audio_types (
    id SERIAL PRIMARY KEY,
    audio_type VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO audio_types (audio_type, description) VALUES
    ('Original', 'Original audio language'),
    ('Hindi Dubbed', 'Dubbed in Hindi language'),
    ('Dual Audio', 'Contains both original and Hindi audio'),
    ('Multi Audio', 'Contains multiple audio languages')
ON CONFLICT (audio_type) DO NOTHING;

CREATE TABLE movie_torrents (
    id BIGSERIAL PRIMARY KEY,
    movie_id BIGINT NOT NULL REFERENCES tmdb_movies(id) ON DELETE CASCADE,
    quality_id INTEGER REFERENCES movie_qualities(id) ON DELETE SET NULL,
    audio_type_id INTEGER REFERENCES audio_types(id) ON DELETE SET NULL,
    source_id INTEGER REFERENCES torrent_sources(id) ON DELETE SET NULL,
    
    magnet_link TEXT UNIQUE NOT NULL,
    torrent_title VARCHAR(1000) NOT NULL,
    info_hash VARCHAR(40) UNIQUE,
    file_size_bytes BIGINT,
    file_size_text VARCHAR(50),
    
    is_hindi_dubbed BOOLEAN DEFAULT FALSE,
    is_dual_audio BOOLEAN DEFAULT FALSE,
    is_bluray BOOLEAN DEFAULT FALSE,
    is_web_dl BOOLEAN DEFAULT FALSE,
    
    seeders INTEGER DEFAULT 0,
    leechers INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0,
    
    upload_date DATE,
    uploader VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_trusted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_seeders_nonnegative CHECK (seeders >= 0),
    CONSTRAINT check_leechers_nonnegative CHECK (leechers >= 0),
    UNIQUE(movie_id, quality_id, is_hindi_dubbed)
);

-- =====================================================
-- 3. TMDB WEBSERIES TABLE
-- =====================================================

CREATE TABLE tmdb_webseries (
    id BIGSERIAL PRIMARY KEY,
    tmdb_id INTEGER UNIQUE NOT NULL,
    imdb_id VARCHAR(20) UNIQUE,
    title VARCHAR(500) NOT NULL,
    original_title VARCHAR(500),
    overview TEXT,
    poster_path VARCHAR(500),
    backdrop_path VARCHAR(500),
    first_air_date DATE,
    last_air_date DATE,
    number_of_seasons INTEGER DEFAULT 0,
    number_of_episodes INTEGER DEFAULT 0,
    episode_run_time INTEGER[],
    vote_average DECIMAL(3,1) DEFAULT 0,
    vote_count INTEGER DEFAULT 0,
    popularity DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50),
    original_language VARCHAR(10),
    homepage VARCHAR(500),
    in_production BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_vote_average_range CHECK (vote_average >= 0 AND vote_average <= 10)
);

-- =====================================================
-- 4. SEASONS TABLE
-- =====================================================

CREATE TABLE seasons (
    id BIGSERIAL PRIMARY KEY,
    webseries_id BIGINT NOT NULL REFERENCES tmdb_webseries(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    season_name VARCHAR(500),
    overview TEXT,
    poster_path VARCHAR(500),
    air_date DATE,
    episode_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(webseries_id, season_number)
);

-- =====================================================
-- 5. FULL SEASON TORRENTS TABLE
-- =====================================================

CREATE TABLE season_qualities (
    id SERIAL PRIMARY KEY,
    quality_name VARCHAR(20) UNIQUE NOT NULL,
    resolution VARCHAR(10),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO season_qualities (quality_name, resolution, sort_order) VALUES
    ('480p', '854x480', 1),
    ('720p', '1280x720', 2),
    ('1080p', '1920x1080', 3),
    ('2160p', '3840x2160', 4),
    ('4K', '3840x2160', 5)
ON CONFLICT (quality_name) DO NOTHING;

CREATE TABLE full_season_torrents (
    id BIGSERIAL PRIMARY KEY,
    webseries_id BIGINT NOT NULL REFERENCES tmdb_webseries(id) ON DELETE CASCADE,
    season_id BIGINT REFERENCES seasons(id) ON DELETE CASCADE,
    quality_id INTEGER REFERENCES season_qualities(id) ON DELETE SET NULL,
    audio_type_id INTEGER REFERENCES audio_types(id) ON DELETE SET NULL,
    source_id INTEGER REFERENCES torrent_sources(id) ON DELETE SET NULL,
    
    season_number INTEGER NOT NULL,
    
    magnet_link TEXT UNIQUE NOT NULL,
    torrent_title VARCHAR(1000) NOT NULL,
    info_hash VARCHAR(40) UNIQUE,
    file_size_bytes BIGINT,
    file_size_text VARCHAR(50),
    
    is_hindi_dubbed BOOLEAN DEFAULT FALSE,
    is_dual_audio BOOLEAN DEFAULT FALSE,
    is_complete_season BOOLEAN DEFAULT TRUE,
    episode_count INTEGER,
    
    seeders INTEGER DEFAULT 0,
    leechers INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0,
    
    upload_date DATE,
    uploader VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_trusted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_season_number_positive CHECK (season_number > 0),
    CONSTRAINT check_seeders_nonnegative CHECK (seeders >= 0),
    UNIQUE(webseries_id, season_number, quality_id, is_hindi_dubbed)
);

-- =====================================================
-- 6. SINGLE EPISODE TORRENTS TABLE
-- =====================================================

CREATE TABLE episode_qualities (
    id SERIAL PRIMARY KEY,
    quality_name VARCHAR(20) UNIQUE NOT NULL,
    resolution VARCHAR(10),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO episode_qualities (quality_name, resolution, sort_order) VALUES
    ('480p', '854x480', 1),
    ('720p', '1280x720', 2),
    ('1080p', '1920x1080', 3),
    ('2160p', '3840x2160', 4),
    ('4K', '3840x2160', 5)
ON CONFLICT (quality_name) DO NOTHING;

CREATE TABLE single_episode_torrents (
    id BIGSERIAL PRIMARY KEY,
    webseries_id BIGINT NOT NULL REFERENCES tmdb_webseries(id) ON DELETE CASCADE,
    season_id BIGINT REFERENCES seasons(id) ON DELETE CASCADE,
    quality_id INTEGER REFERENCES episode_qualities(id) ON DELETE SET NULL,
    audio_type_id INTEGER REFERENCES audio_types(id) ON DELETE SET NULL,
    source_id INTEGER REFERENCES torrent_sources(id) ON DELETE SET NULL,
    
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    episode_title VARCHAR(500),
    
    magnet_link TEXT UNIQUE NOT NULL,
    torrent_title VARCHAR(1000) NOT NULL,
    info_hash VARCHAR(40) UNIQUE,
    file_size_bytes BIGINT,
    file_size_text VARCHAR(50),
    
    is_hindi_dubbed BOOLEAN DEFAULT FALSE,
    is_dual_audio BOOLEAN DEFAULT FALSE,
    
    seeders INTEGER DEFAULT 0,
    leechers INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0,
    
    upload_date DATE,
    uploader VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_trusted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_season_number_positive CHECK (season_number > 0),
    CONSTRAINT check_episode_number_positive CHECK (episode_number > 0),
    CONSTRAINT check_seeders_nonnegative CHECK (seeders >= 0),
    UNIQUE(webseries_id, season_number, episode_number, quality_id, is_hindi_dubbed)
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for tmdb_movies
CREATE INDEX idx_tmdb_movies_tmdb_id ON tmdb_movies(tmdb_id);
CREATE INDEX idx_tmdb_movies_title ON tmdb_movies(title);
CREATE INDEX idx_tmdb_movies_release_date ON tmdb_movies(release_date DESC);
CREATE INDEX idx_tmdb_movies_popularity ON tmdb_movies(popularity DESC);
CREATE INDEX idx_tmdb_movies_search ON tmdb_movies USING GIN (to_tsvector('english', title || ' ' || COALESCE(overview, '')));

-- Indexes for movie_torrents
CREATE INDEX idx_movie_torrents_movie_id ON movie_torrents(movie_id);
CREATE INDEX idx_movie_torrents_quality_id ON movie_torrents(quality_id);
CREATE INDEX idx_movie_torrents_seeders ON movie_torrents(seeders DESC);
CREATE INDEX idx_movie_torrents_hindi_dubbed ON movie_torrents(is_hindi_dubbed);
CREATE INDEX idx_movie_torrents_composite ON movie_torrents(movie_id, quality_id, seeders DESC);

-- Indexes for tmdb_webseries
CREATE INDEX idx_tmdb_webseries_tmdb_id ON tmdb_webseries(tmdb_id);
CREATE INDEX idx_tmdb_webseries_title ON tmdb_webseries(title);
CREATE INDEX idx_tmdb_webseries_first_air_date ON tmdb_webseries(first_air_date DESC);
CREATE INDEX idx_tmdb_webseries_popularity ON tmdb_webseries(popularity DESC);
CREATE INDEX idx_tmdb_webseries_search ON tmdb_webseries USING GIN (to_tsvector('english', title || ' ' || COALESCE(overview, '')));

-- Indexes for seasons
CREATE INDEX idx_seasons_webseries_id ON seasons(webseries_id);
CREATE INDEX idx_seasons_season_number ON seasons(season_number);

-- Indexes for full_season_torrents
CREATE INDEX idx_full_season_webseries_id ON full_season_torrents(webseries_id);
CREATE INDEX idx_full_season_season_number ON full_season_torrents(season_number);
CREATE INDEX idx_full_season_quality_id ON full_season_torrents(quality_id);
CREATE INDEX idx_full_season_seeders ON full_season_torrents(seeders DESC);
CREATE INDEX idx_full_season_composite ON full_season_torrents(webseries_id, season_number, seeders DESC);

-- Indexes for single_episode_torrents
CREATE INDEX idx_episode_webseries_id ON single_episode_torrents(webseries_id);
CREATE INDEX idx_episode_season_episode ON single_episode_torrents(season_number, episode_number);
CREATE INDEX idx_episode_quality_id ON single_episode_torrents(quality_id);
CREATE INDEX idx_episode_seeders ON single_episode_torrents(seeders DESC);
CREATE INDEX idx_episode_composite ON single_episode_torrents(webseries_id, season_number, episode_number, seeders DESC);

-- =====================================================
-- 8. AUTOMATED FUNCTIONS & TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for tables that have updated_at column
CREATE TRIGGER update_tmdb_movies_updated_at
    BEFORE UPDATE ON tmdb_movies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movie_torrents_updated_at
    BEFORE UPDATE ON movie_torrents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tmdb_webseries_updated_at
    BEFORE UPDATE ON tmdb_webseries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasons_updated_at
    BEFORE UPDATE ON seasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_full_season_torrents_updated_at
    BEFORE UPDATE ON full_season_torrents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_single_episode_torrents_updated_at
    BEFORE UPDATE ON single_episode_torrents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. VIEWS FOR COMMON QUERIES
-- =====================================================

CREATE OR REPLACE VIEW movies_with_torrents AS
SELECT 
    m.id,
    m.tmdb_id,
    m.title,
    m.release_date,
    m.vote_average,
    COUNT(DISTINCT mt.id) as total_torrents,
    COUNT(DISTINCT mt.id) FILTER (WHERE mt.is_hindi_dubbed = true) as hindi_dubbed_count,
    MAX(mt.seeders) as max_seeders
FROM tmdb_movies m
LEFT JOIN movie_torrents mt ON m.id = mt.movie_id
GROUP BY m.id;

CREATE OR REPLACE VIEW series_with_torrents AS
SELECT 
    w.id,
    w.tmdb_id,
    w.title,
    w.first_air_date,
    COUNT(DISTINCT fst.id) as season_torrents_count,
    COUNT(DISTINCT set.id) as episode_torrents_count
FROM tmdb_webseries w
LEFT JOIN full_season_torrents fst ON w.id = fst.webseries_id
LEFT JOIN single_episode_torrents set ON w.id = set.webseries_id
GROUP BY w.id;

-- =====================================================
-- 10. SCRAPER WORKFLOW FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_or_create_movie(
    p_tmdb_id INTEGER,
    p_title VARCHAR,
    p_overview TEXT,
    p_release_date DATE,
    p_runtime INTEGER,
    p_vote_average DECIMAL
)
RETURNS BIGINT AS $$
DECLARE
    v_movie_id BIGINT;
BEGIN
    SELECT id INTO v_movie_id FROM tmdb_movies WHERE tmdb_id = p_tmdb_id;
    
    IF v_movie_id IS NULL THEN
        INSERT INTO tmdb_movies (tmdb_id, title, overview, release_date, runtime, vote_average)
        VALUES (p_tmdb_id, p_title, p_overview, p_release_date, p_runtime, p_vote_average)
        RETURNING id INTO v_movie_id;
    END IF;
    
    RETURN v_movie_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_torrent_exists(p_magnet_link TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM movie_torrents WHERE magnet_link = p_magnet_link) INTO v_exists;
    
    IF NOT v_exists THEN
        SELECT EXISTS(SELECT 1 FROM full_season_torrents WHERE magnet_link = p_magnet_link) INTO v_exists;
    END IF;
    
    IF NOT v_exists THEN
        SELECT EXISTS(SELECT 1 FROM single_episode_torrents WHERE magnet_link = p_magnet_link) INTO v_exists;
    END IF;
    
    RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. EXAMPLE INSERT STATEMENTS
-- =====================================================

-- Insert a movie
INSERT INTO tmdb_movies (tmdb_id, title, original_title, overview, release_date, runtime, vote_average) 
VALUES (293660, 'Deadpool', 'Deadpool', 'A wisecracking mercenary gets experimented on and becomes immortal...', '2016-02-12', 108, 8.0)
ON CONFLICT (tmdb_id) DO NOTHING;

-- Insert movie torrents
DO $$
DECLARE
    v_movie_id BIGINT;
    v_quality_720p_id INTEGER;
    v_quality_1080p_id INTEGER;
    v_audio_original_id INTEGER;
    v_audio_hindi_id INTEGER;
    v_source_id INTEGER;
BEGIN
    SELECT id INTO v_movie_id FROM tmdb_movies WHERE tmdb_id = 293660;
    SELECT id INTO v_quality_720p_id FROM movie_qualities WHERE quality_name = '720p';
    SELECT id INTO v_quality_1080p_id FROM movie_qualities WHERE quality_name = '1080p';
    SELECT id INTO v_audio_original_id FROM audio_types WHERE audio_type = 'Original';
    SELECT id INTO v_audio_hindi_id FROM audio_types WHERE audio_type = 'Hindi Dubbed';
    SELECT id INTO v_source_id FROM torrent_sources WHERE source_name = 'ThePirateBay';
    
    INSERT INTO movie_torrents (movie_id, quality_id, audio_type_id, source_id, magnet_link, torrent_title, file_size_text, seeders, is_hindi_dubbed) VALUES
        (v_movie_id, v_quality_720p_id, v_audio_original_id, v_source_id, 'magnet:?xt=urn:btih:deadpool720p', 'Deadpool.2016.720p.BluRay.x264', '1.5 GB', 300, false),
        (v_movie_id, v_quality_1080p_id, v_audio_original_id, v_source_id, 'magnet:?xt=urn:btih:deadpool1080p', 'Deadpool.2016.1080p.BluRay.x264', '3.2 GB', 500, false),
        (v_movie_id, v_quality_1080p_id, v_audio_hindi_id, v_source_id, 'magnet:?xt=urn:btih:deadpool1080phindi', 'Deadpool.2016.1080p.Hindi.Dubbed', '3.5 GB', 200, true);
END $$;

-- Insert a web series
INSERT INTO tmdb_webseries (tmdb_id, title, original_title, overview, first_air_date, number_of_seasons, number_of_episodes, vote_average) 
VALUES (76479, 'The Boys', 'The Boys', 'A group of vigilantes set out to take down corrupt superheroes...', '2019-07-26', 3, 24, 8.7)
ON CONFLICT (tmdb_id) DO NOTHING;

-- Insert seasons
DO $$
DECLARE
    v_webseries_id BIGINT;
BEGIN
    SELECT id INTO v_webseries_id FROM tmdb_webseries WHERE tmdb_id = 76479;
    
    INSERT INTO seasons (webseries_id, season_number, season_name, episode_count) VALUES
        (v_webseries_id, 1, 'Season 1', 8),
        (v_webseries_id, 2, 'Season 2', 8),
        (v_webseries_id, 3, 'Season 3', 8)
    ON CONFLICT (webseries_id, season_number) DO NOTHING;
END $$;

-- Insert full season torrents
DO $$
DECLARE
    v_webseries_id BIGINT;
    v_quality_1080p_id INTEGER;
    v_audio_original_id INTEGER;
    v_source_id INTEGER;
BEGIN
    SELECT id INTO v_webseries_id FROM tmdb_webseries WHERE tmdb_id = 76479;
    SELECT id INTO v_quality_1080p_id FROM season_qualities WHERE quality_name = '1080p';
    SELECT id INTO v_audio_original_id FROM audio_types WHERE audio_type = 'Original';
    SELECT id INTO v_source_id FROM torrent_sources WHERE source_name = 'ThePirateBay';
    
    INSERT INTO full_season_torrents (webseries_id, season_number, quality_id, audio_type_id, source_id, magnet_link, torrent_title, file_size_text, seeders) VALUES
        (v_webseries_id, 1, v_quality_1080p_id, v_audio_original_id, v_source_id, 'magnet:?xt=urn:btih:theboys_s01_1080p', 'The.Boys.S01.1080p.WEB-DL', '25 GB', 600),
        (v_webseries_id, 2, v_quality_1080p_id, v_audio_original_id, v_source_id, 'magnet:?xt=urn:btih:theboys_s02_1080p', 'The.Boys.S02.1080p.WEB-DL', '28 GB', 500);
END $$;

-- Insert single episode torrents
DO $$
DECLARE
    v_webseries_id BIGINT;
    v_quality_720p_id INTEGER;
    v_quality_1080p_id INTEGER;
    v_audio_original_id INTEGER;
    v_source_id INTEGER;
BEGIN
    SELECT id INTO v_webseries_id FROM tmdb_webseries WHERE tmdb_id = 76479;
    SELECT id INTO v_quality_720p_id FROM episode_qualities WHERE quality_name = '720p';
    SELECT id INTO v_quality_1080p_id FROM episode_qualities WHERE quality_name = '1080p';
    SELECT id INTO v_audio_original_id FROM audio_types WHERE audio_type = 'Original';
    SELECT id INTO v_source_id FROM torrent_sources WHERE source_name = 'ThePirateBay';
    
    INSERT INTO single_episode_torrents (webseries_id, season_number, episode_number, quality_id, audio_type_id, source_id, magnet_link, torrent_title, file_size_text, seeders, episode_title) VALUES
        (v_webseries_id, 1, 3, v_quality_720p_id, v_audio_original_id, v_source_id, 'magnet:?xt=urn:btih:theboys_s01e03_720p', 'The.Boys.S01E03.720p.WEB-DL', '1.2 GB', 120, 'Get Some'),
        (v_webseries_id, 1, 3, v_quality_1080p_id, v_audio_original_id, v_source_id, 'magnet:?xt=urn:btih:theboys_s01e03_1080p', 'The.Boys.S01E03.1080p.WEB-DL', '2.5 GB', 200, 'Get Some');
END $$;

-- =====================================================
-- 12. UPDATE STATISTICS
-- =====================================================

ANALYZE tmdb_movies;
ANALYZE movie_torrents;
ANALYZE tmdb_webseries;
ANALYZE seasons;
ANALYZE full_season_torrents;
ANALYZE single_episode_torrents;

-- =====================================================
-- 13. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE tmdb_movies IS 'Master table for all TMDB movies (unique by tmdb_id)';
COMMENT ON TABLE movie_torrents IS 'Torrent files for movies with quality variants';
COMMENT ON TABLE tmdb_webseries IS 'Master table for all TMDB web series (unique by tmdb_id)';
COMMENT ON TABLE full_season_torrents IS 'Complete season torrent packs';
COMMENT ON TABLE single_episode_torrents IS 'Individual episode torrents with quality variants';
COMMENT ON COLUMN movie_torrents.magnet_link IS 'Unique magnet URI for torrent download';