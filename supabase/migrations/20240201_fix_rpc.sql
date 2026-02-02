-- Drop valid function first if exists
DROP FUNCTION IF EXISTS check_update_required(INT, TEXT);

CREATE OR REPLACE FUNCTION check_update_required(
  p_current_version_code INT,
  p_platform TEXT
)
RETURNS TABLE (
  update_required BOOLEAN,
  is_mandatory BOOLEAN,
  latest_version_name TEXT,
  latest_version_code INT,
  update_type TEXT,
  download_url TEXT,
  update_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_latest_version RECORD;
  v_min_version INT;
  v_config RECORD;
BEGIN
  -- 1. Get Global Config
  SELECT * INTO v_config FROM app_config LIMIT 1;

  -- 2. Find Latest Active Version (OTA or Native)
  SELECT * INTO v_latest_version
  FROM app_versions
  WHERE is_active = true
  ORDER BY version_code DESC
  LIMIT 1;

  -- 3. If no version found, return false
  IF v_latest_version IS NULL THEN
    RETURN QUERY SELECT false, false, NULL::TEXT, NULL::INT, NULL::TEXT, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- 4. Check if update is needed
  IF v_latest_version.version_code > p_current_version_code THEN
      RETURN QUERY SELECT 
        true, 
        (v_config.min_supported_version_code > p_current_version_code), -- Mandatory if current < min supported
        v_latest_version.version_name,
        v_latest_version.version_code,
        v_latest_version.update_type,
        v_latest_version.download_url,
        v_latest_version.update_message;
  ELSE
      -- Up to date
      RETURN QUERY SELECT 
        false, 
        false, 
        v_latest_version.version_name,
        v_latest_version.version_code, 
        v_latest_version.update_type, 
        NULL::TEXT, 
        NULL::TEXT;
  END IF;
END;
$$;
