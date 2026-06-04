-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create logbook_entries table
CREATE TABLE IF NOT EXISTS public.logbook_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    excerpt TEXT,
    content TEXT,
    published_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.logbook_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON public.logbook_entries
    FOR SELECT USING (true);

CREATE POLICY "Allow admin full access" ON public.logbook_entries
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert initial dummy data
INSERT INTO public.logbook_entries (entry_id, title, slug, category, excerpt, content, published_date)
VALUES 
('L-012', 'The Anatomy of the Perfect Drape', 'anatomy-of-drape', 'GARMENT STUDY', 'An archival analysis of heavy-weight cotton blends and how gravity influences silhouette over a ten-year wear cycle.', 'Full content goes here...', '2026-05-28'),
('L-011', 'Sourcing the Deadstock Heavyweight', 'sourcing-deadstock-heavyweight', 'BEHIND THE SEAMS', 'Our journey to a forgotten mill in Okayama, recovering 400 yards of discontinued, selvedge-loomed canvas.', 'Full content goes here...', '2026-04-14'),
('L-010', 'Why We Build for the Archive, Not the Season', 'build-for-archive', 'MANIFESTO', 'Fast fashion decays. Archival garments appreciate. The foundational philosophy behind the NINOC construction method.', 'Full content goes here...', '2026-03-02'),
('L-009', 'Hardware Obsession: The YKK Excella Finish', 'hardware-obsession', 'PROCESS', 'A microscopic look at zipper tolerances and why standard hardware fails the decade test.', 'Full content goes here...', '2026-01-18')
ON CONFLICT (slug) DO NOTHING;
