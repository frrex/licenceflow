CREATE TABLE `import_logs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `file_name` text NOT NULL,
  `imported_count` integer NOT NULL,
  `products` text DEFAULT '[]' NOT NULL,
  `created_at` text NOT NULL
);
