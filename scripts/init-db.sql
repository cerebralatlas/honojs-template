-- Database initialization script
-- This file will be executed when PostgreSQL container starts for the first time

-- Create database if it doesn't exist (usually handled by POSTGRES_DB env var)
-- SELECT 'CREATE DATABASE honojs_template' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'honojs_template')\gexec

-- Create extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- You can add any additional initialization scripts here