-- Fix: "permission denied for sequence departments_id_seq" (and other tables' sequences).
-- Run as PostgreSQL superuser on database cachedigitech_hrms.
-- Example: psql -U postgres -h 172.16.110.46 -d cachedigitech_hrms -f prisma/grant-sequences.sql

GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO hrms_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO hrms_user;
