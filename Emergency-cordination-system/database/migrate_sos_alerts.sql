-- Migration script to update the sos_alerts table with new requirements
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS emergency_type VARCHAR(50) NOT NULL DEFAULT 'Other';
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS emergency_message VARCHAR(255);
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS flat_no VARCHAR(50);
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS block VARCHAR(100);
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS society VARCHAR(150);
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Copy existing flat_no, block, and society data from profiles for backward compatibility
UPDATE sos_alerts sa
SET 
    flat_no = f.flat_number,
    block = b.block_name,
    society = s.society_name
FROM resident_profiles rp
JOIN flats f ON rp.flat_id = f.id
JOIN blocks b ON f.block_id = b.id
JOIN societies s ON rp.society_id = s.id
WHERE sa.resident_id = rp.user_id AND (sa.flat_no IS NULL OR sa.block IS NULL OR sa.society IS NULL);

-- Populate dummy/default data for any alerts where copying was not possible (e.g. orphan resident profiles)
UPDATE sos_alerts SET flat_no = 'Unknown' WHERE flat_no IS NULL;
UPDATE sos_alerts SET block = 'Unknown' WHERE block IS NULL;
UPDATE sos_alerts SET society = 'Unknown' WHERE society IS NULL;

-- Apply NOT NULL constraints now that we have populated data
ALTER TABLE sos_alerts ALTER COLUMN flat_no SET NOT NULL;
ALTER TABLE sos_alerts ALTER COLUMN block SET NOT NULL;
ALTER TABLE sos_alerts ALTER COLUMN society SET NOT NULL;

-- Update status defaults and change existing 'Active' status alerts to 'Open'
ALTER TABLE sos_alerts ALTER COLUMN status SET DEFAULT 'Open';
UPDATE sos_alerts SET status = 'Open' WHERE status = 'Active';
