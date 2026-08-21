ALTER TABLE `licenses` ADD `responsible` text DEFAULT '' NOT NULL;
ALTER TABLE `licenses` ADD `department` text DEFAULT '' NOT NULL;
ALTER TABLE `licenses` ADD `archived` integer DEFAULT 0 NOT NULL;
CREATE INDEX `idx_licenses_archived_expiration` ON `licenses` (`archived`,`expiration_date`);
PRAGMA optimize;
