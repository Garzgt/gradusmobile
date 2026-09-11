-- Reusable release query. Run this every time a new APK goes out.
-- Edit the four values, run it, done.
--
-- ORDER MATTERS: upload the new APK to download_url FIRST. If the site still
-- serves the old build, gated students download the same version they were
-- gated for and can never get back in.

UPDATE public.app_versions
SET latest_version        = '1.0.1',
    min_supported_version = '1.0.1',
    download_url          = 'https://www.gradus.college/downloads/mobile',
    release_notes         = 'Testing the pop up update',
    updated_at            = now()
WHERE platform = 'android';

-- Check it took.
SELECT * FROM public.app_versions;

-- Rollback: lets everyone back in without forcing a download.
-- UPDATE public.app_versions
-- SET min_supported_version = '1.0.0',
--     updated_at = now()
-- WHERE platform = 'android';
