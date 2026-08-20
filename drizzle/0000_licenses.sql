CREATE TABLE `licenses` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `product_name` text NOT NULL, `vendor` text NOT NULL, `category` text NOT NULL,
  `start_date` text NOT NULL, `expiration_date` text NOT NULL, `cost` real NOT NULL,
  `currency` text NOT NULL, `description` text DEFAULT '' NOT NULL,
  `created_at` text NOT NULL, `updated_at` text NOT NULL
);
