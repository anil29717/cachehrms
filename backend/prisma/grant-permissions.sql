-- Run as PostgreSQL superuser (e.g. postgres).
-- Connect to database: cachedigitech_hrms
-- Example: psql -U postgres -h 172.16.110.46 -d cachedigitech_hrms -f prisma/grant-permissions.sql

-- Option A (recommended): Make hrms_user owner of public schema. Fixes "permission denied for schema public".
ALTER SCHEMA public OWNER TO hrms_user;

-- Option B: If you cannot change schema owner, use these grants instead:
-- GRANT USAGE, CREATE ON SCHEMA public TO hrms_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hrms_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hrms_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hrms_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hrms_user;

-- If tables were created by postgres, grant sequences so hrms_user can insert (fixes "permission denied for sequence ..._id_seq"):
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO hrms_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO hrms_user;

-- Optional: Allow "prisma migrate dev" (needs shadow DB). Run from any DB:
-- ALTER USER hrms_user CREATEDB;
