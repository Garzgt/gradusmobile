-- Version gate for the distributed APK. One row per platform.
CREATE TABLE public.app_versions (
  platform text NOT NULL CHECK (platform = ANY (ARRAY['android'::text, 'ios'::text])),
  latest_version text NOT NULL,
  min_supported_version text NOT NULL,
  download_url text NOT NULL,
  release_notes text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT app_versions_pkey PRIMARY KEY (platform)
);

ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Readable without a session: the gate runs before the student logs in.
CREATE POLICY app_versions_public_read ON public.app_versions
  FOR SELECT TO anon, authenticated USING (true);

-- Writes stay server-side (service role / SQL editor only). No INSERT, UPDATE
-- or DELETE policy is defined, so anon and authenticated cannot change the gate.

-- Realtime so an open app gates the moment a new minimum is published.
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_versions;

-- Seed matching the APK the download page actually serves (1.0.0). min_supported
-- must never exceed the version behind download_url, or gated students download
-- the same build they were gated for and can never get back in.
INSERT INTO public.app_versions (platform, latest_version, min_supported_version, download_url)
VALUES ('android', '1.0.0', '1.0.0', 'https://www.gradus.college/downloads/mobile');
