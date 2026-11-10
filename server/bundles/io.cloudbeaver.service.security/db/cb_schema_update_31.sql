-- Legacy memberships were marked MANUAL before their actual source was known.
-- Provider and default assignments used the user's own ID as grantor. Preserve assignments made by another user.
-- Preserve manual memberships in administrative teams so providers cannot claim them.
-- The configured default team's grants are normalized to DEFAULT after schema updates.
UPDATE {table_prefix}CB_USER_TEAM
SET GRANT_TYPE='UNKNOWN'
WHERE GRANT_TYPE='MANUAL'
  AND GRANTED_BY=USER_ID
  AND TEAM_ID NOT IN (
      SELECT SUBJECT_ID FROM {table_prefix}CB_AUTH_PERMISSIONS WHERE PERMISSION_ID='admin'
  );
