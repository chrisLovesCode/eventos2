-- Initialisierungsscript für die PostgreSQL Datenbank
-- Wird beim ersten Start der Datenbank ausgeführt

-- Erstelle zusätzliche Datenbank für Tests (optional)
CREATE DATABASE eventos2_test;

-- Erstelle einen Benutzer für die Anwendung (optional, für bessere Sicherheit)
-- CREATE USER eventos2_user WITH PASSWORD 'secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE eventos2_db TO eventos2_user;
-- GRANT ALL PRIVILEGES ON DATABASE eventos2_test TO eventos2_user;

-- Aktiviere wichtige PostgreSQL Erweiterungen
\c eventos2_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c eventos2_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";