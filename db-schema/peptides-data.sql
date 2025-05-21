-- PeptidePal Data Export
-- Run this after schema import to populate development database with test data

-- First, clear any existing test data
DELETE FROM public.peptides WHERE name LIKE '[TEST]%';

-- Insert test copies of production data
