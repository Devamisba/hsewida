-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: hse_db
-- ------------------------------------------------------
-- Server version	10.4.28-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facility_inspections`
--

DROP TABLE IF EXISTS `facility_inspections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `facility_inspections` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `facility_id` bigint(20) unsigned NOT NULL,
  `inspector_id` bigint(20) unsigned NOT NULL,
  `inspection_date` date NOT NULL,
  `checklist_results` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`checklist_results`)),
  `result_status` enum('Pass','Fail') NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `facility_inspections_facility_id_foreign` (`facility_id`),
  KEY `facility_inspections_inspector_id_foreign` (`inspector_id`),
  CONSTRAINT `facility_inspections_facility_id_foreign` FOREIGN KEY (`facility_id`) REFERENCES `safety_facilities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `facility_inspections_inspector_id_foreign` FOREIGN KEY (`inspector_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facility_inspections`
--

LOCK TABLES `facility_inspections` WRITE;
/*!40000 ALTER TABLE `facility_inspections` DISABLE KEYS */;
INSERT INTO `facility_inspections` VALUES (1,1,3,'2026-09-12','{\"pressure\":\"OK\",\"seal\":\"Intact\",\"hose\":\"Good\"}','Pass','Pemeriksaan rutin berkala','2026-09-12 13:24:20','2026-09-12 13:24:20'),(2,1,3,'2026-09-12','{\"pressure\":\"OK\",\"seal\":\"Intact\",\"hose\":\"Good\"}','Pass','Pemeriksaan rutin berkala','2026-09-12 13:29:04','2026-09-12 13:29:04'),(3,1,3,'2026-09-12','{\"pressure\":\"OK\",\"seal\":\"Intact\",\"hose\":\"Good\"}','Pass','Pemeriksaan rutin berkala','2026-09-12 15:18:58','2026-09-12 15:18:58'),(4,1,3,'2026-09-12','{\"pressure\":\"OK\",\"seal\":\"Intact\",\"hose\":\"Good\"}','Pass','Pemeriksaan rutin berkala','2026-09-12 15:24:40','2026-09-12 15:24:40'),(5,1,3,'2026-09-12','{\"pressure\":\"OK\",\"seal\":\"Intact\",\"hose\":\"Good\"}','Pass','Pemeriksaan rutin berkala','2026-09-12 15:50:07','2026-09-12 15:50:07');
/*!40000 ALTER TABLE `facility_inspections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inspection_capas`
--

DROP TABLE IF EXISTS `inspection_capas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inspection_capas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `inspection_id` bigint(20) unsigned NOT NULL,
  `finding_description` text NOT NULL,
  `finding_photo` varchar(255) DEFAULT NULL,
  `severity` enum('Minor','Mayor','Kritis') NOT NULL DEFAULT 'Minor',
  `action_plan` text NOT NULL,
  `pic_name` varchar(255) NOT NULL,
  `due_date` date NOT NULL,
  `capa_photo` varchar(255) DEFAULT NULL,
  `status` enum('Open','In Progress','Closed') NOT NULL DEFAULT 'Open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inspection_capas_inspection_id_foreign` (`inspection_id`),
  CONSTRAINT `inspection_capas_inspection_id_foreign` FOREIGN KEY (`inspection_id`) REFERENCES `facility_inspections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inspection_capas`
--

LOCK TABLES `inspection_capas` WRITE;
/*!40000 ALTER TABLE `inspection_capas` DISABLE KEYS */;
/*!40000 ALTER TABLE `inspection_capas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `locations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `locations_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (1,'Area Pabrik 1','Gedung Produksi Farmasi & Infus Utama',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(2,'Area Pabrik 2','Area Pengemasan & Gudang Sekunder',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(3,'Gedung A, Ruang Server','Fasilitas IT & Server Utama',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(4,'Gedung B Lantai 2','Area Kantor Administrasi & HRD',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(5,'Lobi Utama Gedung B','Area Resepsionis & Pintu Masuk Tamu',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(6,'Area Tangki A','Area Penampungan Bahan Baku Cair',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(7,'Gudang Utama (Bahan Baku)','Gudang Penyimpanan Logistik Utama',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(8,'Area Parkir Basement 2','Area Parkir & Jalur Pipa Hydrant',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(9,'Area Rooftop Gedung A','Atap Bangunan & Sistem Pendingin Chiller',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(10,'Area Silo & Boiler','Ruang Utilitas Pembangkit Uap & Silo',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(11,'Area Boiler Utama','Area operasional turbin dan ketel uap tekanan tinggi',1,'2026-09-12 15:01:42','2026-09-12 15:01:42',NULL);
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_09_12_000001_create_master_tables',1),(5,'2026_09_12_000002_create_work_permits_tables',1),(6,'2026_09_12_000003_create_monitoring_and_notifications_tables',1),(7,'2026_09_12_201156_create_personal_access_tokens_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `type` varchar(100) NOT NULL,
  `reference_id` bigint(20) unsigned DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_foreign` (`user_id`),
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,'permit_approved',4,'Ijin kerja WP-2609-001 telah disetujui ke tahap: Menunggu HSE',0,'2026-09-12 13:24:20','2026-09-12 13:24:20'),(2,1,'permit_approved',5,'Ijin kerja WP-2609-002 telah disetujui ke tahap: Menunggu HSE',0,'2026-09-12 13:29:04','2026-09-12 13:29:04'),(3,1,'permit_approved',6,'Ijin kerja WP-2609-003 telah disetujui ke tahap: Menunggu HSE',0,'2026-09-12 15:18:58','2026-09-12 15:18:58'),(4,1,'permit_approved',7,'Ijin kerja WP-2609-004 telah disetujui ke tahap: Menunggu HSE',0,'2026-09-12 15:24:40','2026-09-12 15:24:40'),(5,1,'permit_approved',8,'Ijin kerja WP-2609-005 telah disetujui ke tahap: Menunggu HSE',0,'2026-09-12 15:50:07','2026-09-12 15:50:07');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `name` varchar(150) NOT NULL,
  `group` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'permits.create','Ajukan Ijin Kerja Baru / Perpanjangan','Work Permit','2026-09-12 13:18:21','2026-09-12 13:18:21'),(2,'permits.view_own','Lihat Ijin Kerja Milik Sendiri','Work Permit','2026-09-12 13:18:21','2026-09-12 13:18:21'),(3,'permits.review_pic','Review Permit Tahap 1 (PIC Vendor)','Work Permit','2026-09-12 13:18:21','2026-09-12 13:18:21'),(4,'permits.review_hse','Review Permit Tahap 2 (HSE)','Work Permit','2026-09-12 13:18:21','2026-09-12 13:18:21'),(5,'permits.review_ga_dept','Review Permit Tahap 3 (HRD & GA Dept Head)','Work Permit','2026-09-12 13:18:21','2026-09-12 13:18:21'),(6,'permits.review_ga_div','Review Permit Tahap 4 (HRD & GA Div Head)','Work Permit','2026-09-12 13:18:21','2026-09-12 13:18:21'),(7,'permits.view_all','Lihat Seluruh Ijin Kerja & Riwayat','Work Permit','2026-09-12 13:18:21','2026-09-12 13:18:21'),(8,'permits.verify_qr','Verifikasi Validitas Permit via QR Code','Work Permit','2026-09-12 13:18:21','2026-09-12 13:18:21'),(9,'documents.upload','Upload Dokumen BPJS / Asuransi Pekerja','Dokumen Pekerja','2026-09-12 13:18:21','2026-09-12 13:18:21'),(10,'documents.verify','Verifikasi Kelayakan Dokumen Pekerja','Dokumen Pekerja','2026-09-12 13:18:21','2026-09-12 13:18:21'),(11,'monitoring.view','Lihat Data Monitoring & Fasilitas K3','Monitoring K3','2026-09-12 13:18:21','2026-09-12 13:18:21'),(12,'inspections.create','Input Hasil Inspeksi K3 (APAR, Hydrant, P3K, dll)','Monitoring K3','2026-09-12 13:18:21','2026-09-12 13:18:21'),(13,'capa.manage','Kelola Temuan K3 & Tindakan CAPA','Monitoring K3','2026-09-12 13:18:21','2026-09-12 13:18:21'),(14,'master.vendors','Kelola Master Data Vendor','Master Data','2026-09-12 13:18:21','2026-09-12 13:18:21'),(15,'master.locations','Kelola Master Data Lokasi','Master Data','2026-09-12 13:18:21','2026-09-12 13:18:21'),(16,'master.permit_options','Kelola Opsi Kategori Ijin & APD','Master Data','2026-09-12 13:18:21','2026-09-12 13:18:21'),(17,'master.roles','Kelola Master Hak Akses & Roles','Master Data','2026-09-12 13:18:21','2026-09-12 13:18:21');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permit_approvals`
--

DROP TABLE IF EXISTS `permit_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permit_approvals` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `work_permit_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `role_at_action` varchar(50) NOT NULL,
  `action` enum('Submit','Approve','Reject') NOT NULL,
  `note` text DEFAULT NULL,
  `action_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `permit_approvals_work_permit_id_foreign` (`work_permit_id`),
  KEY `permit_approvals_user_id_foreign` (`user_id`),
  CONSTRAINT `permit_approvals_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `permit_approvals_work_permit_id_foreign` FOREIGN KEY (`work_permit_id`) REFERENCES `work_permits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permit_approvals`
--

LOCK TABLES `permit_approvals` WRITE;
/*!40000 ALTER TABLE `permit_approvals` DISABLE KEYS */;
INSERT INTO `permit_approvals` VALUES (1,1,1,'pemohon','Submit','Pengajuan permit pengelasan pipa baru','2026-09-12 13:18:26'),(2,4,1,'pemohon','Submit','Pengajuan permit kerja baru oleh vendor.','2026-09-12 13:24:20'),(3,4,2,'pic_vendor','Approve','Disetujui oleh PIC Vendor untuk verifikasi HSE.','2026-09-12 13:24:20'),(4,5,1,'pemohon','Submit','Pengajuan permit kerja baru oleh vendor.','2026-09-12 13:29:04'),(5,5,2,'pic_vendor','Approve','Disetujui oleh PIC Vendor untuk verifikasi HSE.','2026-09-12 13:29:04'),(6,6,1,'pemohon','Submit','Pengajuan permit kerja baru oleh vendor.','2026-09-12 15:18:58'),(7,6,2,'pic_vendor','Approve','Disetujui oleh PIC Vendor untuk verifikasi HSE.','2026-09-12 15:18:58'),(8,7,1,'pemohon','Submit','Pengajuan permit kerja baru oleh vendor.','2026-09-12 15:24:40'),(9,7,2,'pic_vendor','Approve','Disetujui oleh PIC Vendor untuk verifikasi HSE.','2026-09-12 15:24:40'),(10,8,1,'pemohon','Submit','Pengajuan permit kerja baru oleh vendor.','2026-09-12 15:50:07'),(11,8,2,'pic_vendor','Approve','Disetujui oleh PIC Vendor untuk verifikasi HSE.','2026-09-12 15:50:07');
/*!40000 ALTER TABLE `permit_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permit_documents`
--

DROP TABLE IF EXISTS `permit_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permit_documents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `permit_worker_id` bigint(20) unsigned NOT NULL,
  `document_type` enum('BPJS_TK','BPJS_Kesehatan','Asuransi_Lain') NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `uploaded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `permit_documents_permit_worker_id_foreign` (`permit_worker_id`),
  CONSTRAINT `permit_documents_permit_worker_id_foreign` FOREIGN KEY (`permit_worker_id`) REFERENCES `permit_workers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permit_documents`
--

LOCK TABLES `permit_documents` WRITE;
/*!40000 ALTER TABLE `permit_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `permit_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permit_equipments`
--

DROP TABLE IF EXISTS `permit_equipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permit_equipments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `work_permit_id` bigint(20) unsigned NOT NULL,
  `equipment_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `permit_equipments_work_permit_id_foreign` (`work_permit_id`),
  CONSTRAINT `permit_equipments_work_permit_id_foreign` FOREIGN KEY (`work_permit_id`) REFERENCES `work_permits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permit_equipments`
--

LOCK TABLES `permit_equipments` WRITE;
/*!40000 ALTER TABLE `permit_equipments` DISABLE KEYS */;
INSERT INTO `permit_equipments` VALUES (1,1,'Mesin Las Inverter'),(2,1,'Tabung Gas Argon'),(3,1,'APAR Powder 6kg'),(4,1,'Gerinda Tangan'),(5,2,'Tangga Aluminium Lipat'),(6,2,'Bor Tembok'),(7,2,'Toolbox Set'),(8,4,'Mesin Las'),(9,4,'Tangga'),(10,5,'Mesin Las'),(11,5,'Tangga'),(12,6,'Mesin Las'),(13,6,'Tangga'),(14,7,'Mesin Las'),(15,7,'Tangga'),(16,8,'Mesin Las'),(17,8,'Tangga');
/*!40000 ALTER TABLE `permit_equipments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permit_jsas`
--

DROP TABLE IF EXISTS `permit_jsas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permit_jsas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `work_permit_id` bigint(20) unsigned NOT NULL,
  `step_sequence` int(11) NOT NULL,
  `work_step` text NOT NULL,
  `equipment_used` varchar(255) DEFAULT NULL,
  `hazard_potential` text NOT NULL,
  `mitigation_control` text NOT NULL,
  `emergency_response` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `permit_jsas_work_permit_id_foreign` (`work_permit_id`),
  CONSTRAINT `permit_jsas_work_permit_id_foreign` FOREIGN KEY (`work_permit_id`) REFERENCES `work_permits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permit_jsas`
--

LOCK TABLES `permit_jsas` WRITE;
/*!40000 ALTER TABLE `permit_jsas` DISABLE KEYS */;
INSERT INTO `permit_jsas` VALUES (1,1,1,'Persiapan area dan peralatan las','Mesin Las, Kabel Power','Kebocoran arus listrik, kabel terkelupas','Inspeksi grounding & kabel, pastikan area kering','Matikan panel breaker utama jika ada korsleting','2026-09-12 13:18:26','2026-09-12 13:18:26'),(2,1,2,'Proses pengelasan pipa','Welding Torch, Gerinda','Percikan api mengenai bahan mudah terbakar','Pasang fire blanket, bersihkan area 10m dari flammable, siapkan APAR standby','Gunakan APAR segera, tekan tombol alarm kebakaran terdekat','2026-09-12 13:18:26','2026-09-12 13:18:26'),(3,2,1,'Pemasangan bracket indoor unit','Bor Listrik, Tangga','Terjatuh dari tangga, debu dinding','Tangga dipegangi helper, gunakan kacamata & masker','Pertolongan pertama pada kotak P3K','2026-09-12 13:18:26','2026-09-12 13:18:26'),(4,4,1,'Persiapan','Kabel','Korsleting','Cek isolasi','APAR','2026-09-12 13:24:20','2026-09-12 13:24:20'),(5,5,1,'Persiapan','Kabel','Korsleting','Cek isolasi','APAR','2026-09-12 13:29:04','2026-09-12 13:29:04'),(6,6,1,'Persiapan','Kabel','Korsleting','Cek isolasi','APAR','2026-09-12 15:18:58','2026-09-12 15:18:58'),(7,7,1,'Persiapan','Kabel','Korsleting','Cek isolasi','APAR','2026-09-12 15:24:40','2026-09-12 15:24:40'),(8,8,1,'Persiapan','Kabel','Korsleting','Cek isolasi','APAR','2026-09-12 15:50:07','2026-09-12 15:50:07');
/*!40000 ALTER TABLE `permit_jsas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permit_ppes_pivot`
--

DROP TABLE IF EXISTS `permit_ppes_pivot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permit_ppes_pivot` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `work_permit_id` bigint(20) unsigned NOT NULL,
  `ppe_option_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `permit_ppes_pivot_work_permit_id_foreign` (`work_permit_id`),
  KEY `permit_ppes_pivot_ppe_option_id_foreign` (`ppe_option_id`),
  CONSTRAINT `permit_ppes_pivot_ppe_option_id_foreign` FOREIGN KEY (`ppe_option_id`) REFERENCES `ppe_options` (`id`) ON DELETE CASCADE,
  CONSTRAINT `permit_ppes_pivot_work_permit_id_foreign` FOREIGN KEY (`work_permit_id`) REFERENCES `work_permits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permit_ppes_pivot`
--

LOCK TABLES `permit_ppes_pivot` WRITE;
/*!40000 ALTER TABLE `permit_ppes_pivot` DISABLE KEYS */;
INSERT INTO `permit_ppes_pivot` VALUES (1,1,1),(2,1,2),(3,1,7),(4,1,11),(5,1,14),(6,2,1),(7,2,2),(8,2,11),(9,4,1),(10,4,2),(11,4,7),(12,5,1),(13,5,2),(14,5,7),(15,6,1),(16,6,2),(17,6,7),(18,7,1),(19,7,2),(20,7,7),(21,8,1),(22,8,2),(23,8,7);
/*!40000 ALTER TABLE `permit_ppes_pivot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permit_type_options`
--

DROP TABLE IF EXISTS `permit_type_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permit_type_options` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permit_type_options_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permit_type_options`
--

LOCK TABLES `permit_type_options` WRITE;
/*!40000 ALTER TABLE `permit_type_options` DISABLE KEYS */;
INSERT INTO `permit_type_options` VALUES (1,'Confined Space',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(2,'High Voltage Electricity',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(3,'Heavy Lifting',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(4,'Hot Work',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(5,'Excavation (LOTO)',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(6,'Work at Height',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(7,'Others',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(8,'Izin Radiografi Rev 1789226768761',1,'2026-09-12 15:26:08','2026-09-12 15:26:09','2026-09-12 15:26:09'),(9,'Izin Radiografi Rev 1789226818930',1,'2026-09-12 15:26:58','2026-09-12 15:26:59','2026-09-12 15:26:59');
/*!40000 ALTER TABLE `permit_type_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permit_types_pivot`
--

DROP TABLE IF EXISTS `permit_types_pivot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permit_types_pivot` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `work_permit_id` bigint(20) unsigned NOT NULL,
  `permit_type_option_id` bigint(20) unsigned NOT NULL,
  `custom_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `permit_types_pivot_work_permit_id_foreign` (`work_permit_id`),
  KEY `permit_types_pivot_permit_type_option_id_foreign` (`permit_type_option_id`),
  CONSTRAINT `permit_types_pivot_permit_type_option_id_foreign` FOREIGN KEY (`permit_type_option_id`) REFERENCES `permit_type_options` (`id`) ON DELETE CASCADE,
  CONSTRAINT `permit_types_pivot_work_permit_id_foreign` FOREIGN KEY (`work_permit_id`) REFERENCES `work_permits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permit_types_pivot`
--

LOCK TABLES `permit_types_pivot` WRITE;
/*!40000 ALTER TABLE `permit_types_pivot` DISABLE KEYS */;
INSERT INTO `permit_types_pivot` VALUES (1,1,4,NULL),(2,2,6,NULL),(3,3,1,NULL),(4,4,4,NULL),(5,4,6,NULL),(6,5,4,NULL),(7,5,6,NULL),(8,6,4,NULL),(9,6,6,NULL),(10,7,4,NULL),(11,7,6,NULL),(12,8,4,NULL),(13,8,6,NULL);
/*!40000 ALTER TABLE `permit_types_pivot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permit_workers`
--

DROP TABLE IF EXISTS `permit_workers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permit_workers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `work_permit_id` bigint(20) unsigned NOT NULL,
  `worker_name` varchar(255) NOT NULL,
  `position` varchar(100) NOT NULL,
  `address` text DEFAULT NULL,
  `id_card_photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `permit_workers_work_permit_id_foreign` (`work_permit_id`),
  CONSTRAINT `permit_workers_work_permit_id_foreign` FOREIGN KEY (`work_permit_id`) REFERENCES `work_permits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permit_workers`
--

LOCK TABLES `permit_workers` WRITE;
/*!40000 ALTER TABLE `permit_workers` DISABLE KEYS */;
INSERT INTO `permit_workers` VALUES (1,1,'Tono','Welder 6G','Jl. Pahlawan No 45',NULL,'2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(2,1,'Budi','Fitter','Perum Indah Blok C2',NULL,'2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(3,1,'Andi','Helper','Jl. Melati Raya No 8',NULL,'2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(4,2,'Doni','Teknisi AC','Jl. Anggrek No 12',NULL,'2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(5,2,'Feri','Helper Teknisi','Jl. Mawar Indah 3',NULL,'2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(6,4,'Pekerja 1','Welder','Surabaya',NULL,'2026-09-12 13:24:20','2026-09-12 13:24:20',NULL),(7,4,'Pekerja 2','Fitter','Sidoarjo',NULL,'2026-09-12 13:24:20','2026-09-12 13:24:20',NULL),(8,5,'Pekerja 1','Welder','Surabaya',NULL,'2026-09-12 13:29:04','2026-09-12 13:29:04',NULL),(9,5,'Pekerja 2','Fitter','Sidoarjo',NULL,'2026-09-12 13:29:04','2026-09-12 13:29:04',NULL),(10,6,'Pekerja 1','Welder','Surabaya',NULL,'2026-09-12 15:18:58','2026-09-12 15:18:58',NULL),(11,6,'Pekerja 2','Fitter','Sidoarjo',NULL,'2026-09-12 15:18:58','2026-09-12 15:18:58',NULL),(12,7,'Pekerja 1','Welder','Surabaya',NULL,'2026-09-12 15:24:40','2026-09-12 15:24:40',NULL),(13,7,'Pekerja 2','Fitter','Sidoarjo',NULL,'2026-09-12 15:24:40','2026-09-12 15:24:40',NULL),(14,8,'Pekerja 1','Welder','Surabaya',NULL,'2026-09-12 15:50:07','2026-09-12 15:50:07',NULL),(15,8,'Pekerja 2','Fitter','Sidoarjo',NULL,'2026-09-12 15:50:07','2026-09-12 15:50:07',NULL);
/*!40000 ALTER TABLE `permit_workers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (1,'App\\Models\\User',1,'auth_token','22ff7b92c1d2fd787c634eb24435c1e11f99a576cc83d12d52a5e3ddb7c7c941','[\"*\"]',NULL,NULL,'2026-09-12 13:24:20','2026-09-12 13:24:20'),(2,'App\\Models\\User',1,'auth_token','45edb3ad6099cb85a433dfd291eddd9409f1ad4eb59a963e8ec9ff49f93c1dcc','[\"*\"]',NULL,NULL,'2026-09-12 13:29:03','2026-09-12 13:29:03'),(3,'App\\Models\\User',6,'auth_token','5520139d31babb05c60294b37a5a3c2f2d1f4e37d6a0686bd4e19d3a5ba235f9','[\"*\"]','2026-09-12 15:01:42',NULL,'2026-09-12 15:01:31','2026-09-12 15:01:42'),(4,'App\\Models\\User',6,'auth_token','a2cf54a1a5fa7514426c58d7799c9ffc07a7bb0b4e27910468c8a01df935f716','[\"*\"]','2026-09-12 15:10:36',NULL,'2026-09-12 15:03:27','2026-09-12 15:10:36'),(5,'App\\Models\\User',3,'auth_token','33f89de28ad31fbb955f12ed76a50a8cac77f6e32f551f064ad10ae1cc68284b','[\"*\"]',NULL,NULL,'2026-09-12 15:04:41','2026-09-12 15:04:41'),(6,'App\\Models\\User',6,'auth_token','63346681bb7bee9f523f6f8c24901208c784417f1eac1c28872d79e7b0c1afc4','[\"*\"]','2026-09-12 15:39:47',NULL,'2026-09-12 15:11:35','2026-09-12 15:39:47'),(7,'App\\Models\\User',1,'auth_token','5e96cbdc8c844a125e8a68d37386c4c11bc790295571df35c8a4efa329045226','[\"*\"]',NULL,NULL,'2026-09-12 15:18:58','2026-09-12 15:18:58'),(8,'App\\Models\\User',6,'auth_token','49cb5149dd1f8a22974ec4986a5d0e11e032c29958c69add78ef8bc87348f920','[\"*\"]','2026-09-12 15:19:08',NULL,'2026-09-12 15:19:07','2026-09-12 15:19:08'),(9,'App\\Models\\User',1,'auth_token','4381bebfd8be66c8fdb441caa1e75041a3304f495506e766b60821dbc62eedfa','[\"*\"]',NULL,NULL,'2026-09-12 15:24:39','2026-09-12 15:24:39'),(10,'App\\Models\\User',6,'auth_token','512ecfa795f7728f65d993c7bbd4818e2944ae6981134590b9897b46f18084a2','[\"*\"]',NULL,NULL,'2026-09-12 15:25:52','2026-09-12 15:25:52'),(11,'App\\Models\\User',6,'auth_token','e2c3903ae70b6cfc3e0b1eca720f8ef6abe363610ca8d06effd97a6cde1fb2e4','[\"*\"]','2026-09-12 15:26:12',NULL,'2026-09-12 15:26:03','2026-09-12 15:26:12'),(12,'App\\Models\\User',6,'auth_token','31648594c5ef06ff6071ea613ffa6df5ed086c32a2bb498bd82c53c8301f91c2','[\"*\"]','2026-09-12 15:27:02',NULL,'2026-09-12 15:26:52','2026-09-12 15:27:02'),(13,'App\\Models\\User',1,'auth_token','5a7f92b633ba7e4896a0363636f8d4c259af53a9f96c2e3189a3920a11b09a29','[\"*\"]',NULL,NULL,'2026-09-12 15:50:07','2026-09-12 15:50:07'),(14,'App\\Models\\User',3,'auth_token','ae53bdd605a5ce3925ef6649256c4743939215cfcc0c0d57391856f0d08b2155','[\"*\"]','2026-09-12 15:50:29',NULL,'2026-09-12 15:50:19','2026-09-12 15:50:29'),(15,'App\\Models\\User',1,'auth_token','78d6fdec47d49b4260d74fe5189bfc9cf9df227ac90a15142d680a3ab5d15bd1','[\"*\"]','2026-09-12 15:50:45',NULL,'2026-09-12 15:50:43','2026-09-12 15:50:45'),(16,'App\\Models\\User',1,'auth_token','4879e3d180f34d8979e63fe481ecb4da323762ed94213a51fcfaf962d5437600','[\"*\"]','2026-09-12 15:51:31',NULL,'2026-09-12 15:51:31','2026-09-12 15:51:31'),(17,'App\\Models\\User',6,'auth_token','67c53b73393bc77022c41d91a81e285b7cb1f27042382ea033354e166986fc04','[\"*\"]',NULL,NULL,'2026-09-14 01:05:16','2026-09-14 01:05:16'),(18,'App\\Models\\User',6,'auth_token','1f8786fc8b185745ed204812b3fdffd7d9ad4f95171b03668d954a8cba6a4fed','[\"*\"]',NULL,NULL,'2026-09-14 01:13:09','2026-09-14 01:13:09');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ppe_options`
--

DROP TABLE IF EXISTS `ppe_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ppe_options` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ppe_options_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ppe_options`
--

LOCK TABLES `ppe_options` WRITE;
/*!40000 ALTER TABLE `ppe_options` DISABLE KEYS */;
INSERT INTO `ppe_options` VALUES (1,'Safety Helmet',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(2,'Safety Shoes',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(3,'Body Harness',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(4,'Safety Net',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(5,'Scaffolding',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(6,'Safety Glasses',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(7,'Face Shield',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(8,'Respiratory Protection',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(9,'Safety Line',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(10,'Ear Plug/Muff',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(11,'Gloves',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(12,'Breathing Apparatus',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(13,'Stairs',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(14,'Fire Extinguisher',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(15,'Lifeline',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(16,'Sign',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(17,'Barricade',1,'2026-09-12 13:18:22','2026-09-12 13:18:22',NULL),(18,'Full Body Harness Rev 1789226770419',1,'2026-09-12 15:26:10','2026-09-12 15:26:11','2026-09-12 15:26:11'),(19,'Full Body Harness Rev 1789226820568',1,'2026-09-12 15:27:00','2026-09-12 15:27:01','2026-09-12 15:27:01');
/*!40000 ALTER TABLE `ppe_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint(20) unsigned NOT NULL,
  `permission_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `role_permissions_role_id_foreign` (`role_id`),
  KEY `role_permissions_permission_id_foreign` (`permission_id`),
  CONSTRAINT `role_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,1,NULL,NULL),(2,1,2,NULL,NULL),(3,1,9,NULL,NULL),(4,1,8,NULL,NULL),(5,2,3,NULL,NULL),(6,2,7,NULL,NULL),(7,2,8,NULL,NULL),(8,3,1,NULL,NULL),(9,3,4,NULL,NULL),(10,3,7,NULL,NULL),(11,3,8,NULL,NULL),(12,3,11,NULL,NULL),(13,3,12,NULL,NULL),(14,3,13,NULL,NULL),(15,3,15,NULL,NULL),(16,3,16,NULL,NULL),(17,4,5,NULL,NULL),(18,4,7,NULL,NULL),(19,4,10,NULL,NULL),(20,4,11,NULL,NULL),(21,4,14,NULL,NULL),(22,4,15,NULL,NULL),(23,5,6,NULL,NULL),(24,5,7,NULL,NULL),(25,5,10,NULL,NULL),(26,5,11,NULL,NULL),(27,6,1,NULL,NULL),(28,6,2,NULL,NULL),(29,6,3,NULL,NULL),(30,6,4,NULL,NULL),(31,6,5,NULL,NULL),(32,6,6,NULL,NULL),(33,6,7,NULL,NULL),(34,6,8,NULL,NULL),(35,6,9,NULL,NULL),(36,6,10,NULL,NULL),(37,6,11,NULL,NULL),(38,6,12,NULL,NULL),(39,6,13,NULL,NULL),(40,6,14,NULL,NULL),(41,6,15,NULL,NULL),(42,6,16,NULL,NULL),(43,6,17,NULL,NULL),(44,8,1,NULL,NULL),(45,8,2,NULL,NULL),(46,8,3,NULL,NULL);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'pemohon','Vendor / Kontraktor','Mengajukan permohonan ijin kerja baru/perpanjangan, data pekerja, APD, dan JSA.',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(2,'pic_vendor','PIC Vendor (Internal)','Penanggung jawab internal PT Widatra Bhakti atas vendor. Melakukan review tahap 1.',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(3,'hse','Tim K3 / HSE Officer','Melakukan review keselamatan tahap 2, validasi JSA, mitigasi risiko, inspeksi fasilitas K3, dan CAPA.',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(4,'ga_dept_head','HRD & GA Dept Head','Melakukan review administratif tahap 3 (validasi data pekerja eksternal, asuransi/BPJS, akses area).',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(5,'ga_div_head','HRD & GA Div Head','Melakukan validasi akhir tahap 4 (Final Sign-off) yang mengaktifkan status ijin kerja resmi.',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(6,'admin','System Administrator','Akses penuh ke konfigurasi sistem, master data, dan pengelolaan hak akses pengguna.',1,'2026-09-12 13:18:21','2026-09-12 13:18:21',NULL),(7,'safety_officer_1789226765958','Safety Officer Lapangan','Petugas lapangan pemeriksa APD',1,'2026-09-12 15:26:06','2026-09-12 15:26:08','2026-09-12 15:26:08'),(8,'safety_officer_1789226816182','Safety Officer Lapangan','Petugas lapangan pemeriksa APD',1,'2026-09-12 15:26:56','2026-09-12 15:26:58','2026-09-12 15:26:58');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `safety_facilities`
--

DROP TABLE IF EXISTS `safety_facilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `safety_facilities` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `category` enum('apar','hydrant','emergency_door','p3k','safety_mirror','assembly_point') NOT NULL,
  `location_id` bigint(20) unsigned DEFAULT NULL,
  `specifications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`specifications`)),
  `status` enum('Good','Needs Attention','Critical') NOT NULL DEFAULT 'Good',
  `last_inspected_at` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `safety_facilities_code_unique` (`code`),
  KEY `safety_facilities_location_id_foreign` (`location_id`),
  CONSTRAINT `safety_facilities_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safety_facilities`
--

LOCK TABLES `safety_facilities` WRITE;
/*!40000 ALTER TABLE `safety_facilities` DISABLE KEYS */;
INSERT INTO `safety_facilities` VALUES (1,'AP-001','apar',1,'{\"type\":\"Dry Chemical Powder\",\"capacity\":\"6 Kg\",\"pressure\":\"Normal\"}','Good','2026-09-12','2026-09-12 13:18:26','2026-09-12 13:24:20',NULL),(2,'AP-002','apar',3,'{\"type\":\"Clean Agent \\/ CO2\",\"capacity\":\"5 Kg\",\"pressure\":\"Normal\"}','Good','2026-08-20','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(3,'AP-003','apar',7,'{\"type\":\"Foam AFFF\",\"capacity\":\"9 Liter\",\"pressure\":\"Low\"}','Needs Attention','2026-08-15','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(4,'HY-001','hydrant',1,'{\"type\":\"Pillar Hydrant 2-Way\",\"pressure_bar\":7.5,\"equipment\":\"Complete\"}','Good','2026-08-20','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(5,'HY-002','hydrant',8,'{\"type\":\"Indoor Hydrant Box\",\"pressure_bar\":6.8,\"equipment\":\"Nozzle Checked\"}','Good','2026-08-18','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(6,'ED-001','emergency_door',1,'{\"mechanism\":\"Push Panic Bar\",\"exit_sign\":\"Lit\",\"pathway\":\"Clear\"}','Good','2026-08-20','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(7,'ED-002','emergency_door',4,'{\"mechanism\":\"Push Panic Bar\",\"exit_sign\":\"Lit\",\"pathway\":\"Clear\"}','Good','2026-08-20','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(8,'FA-001','p3k',1,'{\"box_type\":\"Form B (50 Pekerja)\",\"checklist\":\"21 items full\"}','Good','2026-08-20','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(9,'FA-002','p3k',7,'{\"box_type\":\"Form A (25 Pekerja)\",\"checklist\":\"Perban & Betadine Restocked\"}','Good','2026-08-19','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(10,'SM-001','safety_mirror',8,'{\"diameter\":\"80 cm\",\"surface\":\"Convex Polycarbonate\",\"view\":\"Clear\"}','Good','2026-08-20','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(11,'AP-POINT-1','assembly_point',1,'{\"capacity\":\"200 Personel\",\"signage\":\"Visible Reflective\"}','Good','2026-08-20','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL);
/*!40000 ALTER TABLE `safety_facilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('5icS55ql3oyJvy1YgdtodYtmDhO2YDtxdXPOInn5',NULL,'127.0.0.1','curl/8.21.0','YToyOntzOjY6Il90b2tlbiI7czo0MDoiYTZjekZsSGd5S0dRMHdCY204Q3FlckVLWUlkejN1RTBjN1BYSEIyTSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1789347832);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` bigint(20) unsigned DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `phone_number` varchar(30) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_id_foreign` (`role_id`),
  CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'PT Maju Mundur (Vendor)','vendor@hse.com',NULL,'$2y$12$hPl/UbwcYXiYb3fuVSwT3e5jVD1N4ejVbDHoCGasQ2WzOjyO4CY.a',1,'PT Maju Mundur','Eksternal','081122334455',NULL,'2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(2,'PIC Vendor Widatra','pic@hse.com',NULL,'$2y$12$1.dYMftRzLj1pvuei7Lo3.v9nPcgBLg3NNBUbA2QX.Y5yZsedKfOm',2,'PT Widatra Bhakti','Vendor Management','089988776655',NULL,'2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(3,'Tim K3 / HSE','hse@hse.com',NULL,'$2y$12$.V5bVll0LC0SVOykJwf9NuBABBQOnMwjMAsLe2MXagGn5EzkK07CK',3,'PT Widatra Bhakti','Health Safety & Environment','085566778899',NULL,'2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(4,'P. Andaru','ga_dept@hse.com',NULL,'$2y$12$uRvp.s2GYVCvGOaeCkwriOJDq2I6YyHMNh8TvuD0WPTtOqv0t8re6',4,'PT Widatra Bhakti','HRD & GA Department','081234567890',NULL,'2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(5,'P. Effendy','ga_div@hse.com',NULL,'$2y$12$BB74VDbsCjZM.2XkQr2F0.jPzcPnc2DwWLkiSMldMp1yTRFcA97vm',5,'PT Widatra Bhakti','HRD & GA Division','082345678901',NULL,'2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(6,'System Administrator','admin@hse.com',NULL,'$2y$12$wvp3t7.vFJmrTdoFyQSEiej6tiiXPqkLWTCXPaIEf0y8LZs4FDita',6,'PT Widatra Bhakti','IT & Systems','081199001122',NULL,'2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(7,'Operator Uji Coba Updated','operator_test_1789226763087@widatra.com',NULL,'$2y$12$bOqJ08lI3//DgfGT7Xb0ju50a7FbusCu.awLazRjC36UA63PGNRlu',1,NULL,NULL,'081299998888',NULL,'2026-09-12 15:26:04','2026-09-12 15:26:05','2026-09-12 15:26:05'),(8,'Operator Uji Coba Updated','operator_test_1789226812621@widatra.com',NULL,'$2y$12$7fH4J.Q0xDoP8DlOJtgK5OSXrKT9VZNJgeGKi4SWXFabSLfR.vPc.',1,NULL,NULL,'081299998888',NULL,'2026-09-12 15:26:53','2026-09-12 15:26:56','2026-09-12 15:26:56'),(9,'GOLONGKOMENG','golong@gmail.com',NULL,'$2y$12$GT9RaKrABsb/BOj.VNpmeuqe9Py4h0o9HIYrLw.7gSDcX5uz.Swpe',1,'PT GOLONGKOMENG','Vendor','0812345667',NULL,'2026-09-12 15:33:10','2026-09-12 15:33:10',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `main_contact_name` varchar(255) DEFAULT NULL,
  `main_contact_phone` varchar(50) DEFAULT NULL,
  `pic_vendor_user_id` bigint(20) unsigned DEFAULT NULL,
  `status` enum('Aktif','Nonaktif','Blacklist') NOT NULL DEFAULT 'Aktif',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vendors_pic_vendor_user_id_foreign` (`pic_vendor_user_id`),
  CONSTRAINT `vendors_pic_vendor_user_id_foreign` FOREIGN KEY (`pic_vendor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
INSERT INTO `vendors` VALUES (1,'PT Maju Mundur','Jl. Industri Rungkut No. 12, Surabaya','Budi Santoso','081234567890',2,'Aktif','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(2,'PT Bangun Karya','Jl. Pahlawan No. 45, Pasuruan','Agus Supriyadi','081298765432',2,'Aktif','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(3,'PT Amanah Karya','Kawasan Industri PIER Blok C-4, Pasuruan','Rudi Hartono','085566778899',2,'Aktif','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(4,'CV Konstruksi Jaya','Jl. Raya Pandaan KM 42, Pasuruan','Denny Setiawan','082233445566',2,'Aktif','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL);
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_permits`
--

DROP TABLE IF EXISTS `work_permits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `work_permits` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `permit_number` varchar(50) NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `vendor_id` bigint(20) unsigned DEFAULT NULL,
  `request_type` enum('Baru','Perpanjangan') NOT NULL DEFAULT 'Baru',
  `parent_permit_id` bigint(20) unsigned DEFAULT NULL,
  `job_title` varchar(255) NOT NULL,
  `location_id` bigint(20) unsigned DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `daily_start_time` time NOT NULL,
  `daily_end_time` time NOT NULL,
  `pic_name` varchar(255) NOT NULL,
  `pic_phone` varchar(50) NOT NULL,
  `supervisor_name` varchar(255) NOT NULL,
  `supervisor_phone` varchar(50) NOT NULL,
  `hse_officer_name` varchar(255) NOT NULL,
  `hse_officer_phone` varchar(50) NOT NULL,
  `total_workers` int(11) NOT NULL DEFAULT 1,
  `risk_level` enum('Rendah','Sedang','Tinggi') NOT NULL DEFAULT 'Rendah',
  `status` enum('Draft','Menunggu PIC Vendor','Menunggu HSE','Menunggu GA Dept Head','Menunggu GA Div Head','Disetujui','Ditolak','Selesai') NOT NULL DEFAULT 'Draft',
  `reject_reason` text DEFAULT NULL,
  `qr_code_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `work_permits_permit_number_unique` (`permit_number`),
  UNIQUE KEY `work_permits_qr_code_token_unique` (`qr_code_token`),
  KEY `work_permits_user_id_foreign` (`user_id`),
  KEY `work_permits_vendor_id_foreign` (`vendor_id`),
  KEY `work_permits_parent_permit_id_foreign` (`parent_permit_id`),
  KEY `work_permits_location_id_foreign` (`location_id`),
  CONSTRAINT `work_permits_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `work_permits_parent_permit_id_foreign` FOREIGN KEY (`parent_permit_id`) REFERENCES `work_permits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `work_permits_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_permits_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_permits`
--

LOCK TABLES `work_permits` WRITE;
/*!40000 ALTER TABLE `work_permits` DISABLE KEYS */;
INSERT INTO `work_permits` VALUES (1,'WP-2608-058',1,1,'Baru',NULL,'Pengelasan Pipa Jalur Utama',6,'2026-09-15','2026-09-18','08:00:00','16:00:00','Budi Santoso','081233445566','Agus','081122334455','Dina','087788990011',3,'Tinggi','Menunggu HSE',NULL,'QR-WP-2608-058-ef57b4af5309','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(2,'WP-2608-062',1,1,'Baru',NULL,'Instalasi AC Split Kantor Lantai 2',4,'2026-09-15','2026-09-17','09:00:00','17:00:00','Rudi Hartono','085566778899','Samsul','082233445566','Rian','083344556677',2,'Rendah','Menunggu GA Dept Head',NULL,'QR-WP-2608-062-8f2e4a035195','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(3,'WP-2608-050',1,1,'Baru',NULL,'Pembersihan & Inspeksi Silo Utama',10,'2026-09-12','2026-09-14','08:00:00','16:00:00','Heri Susanto','081223344556','Denny Caknan','085566778899','Sinta Maharani','089911223344',2,'Tinggi','Disetujui',NULL,'QR-WP-2608-050-afaeb2eece19','2026-09-12 13:18:26','2026-09-12 13:18:26',NULL),(4,'WP-2609-001',1,1,'Baru',NULL,'Uji Coba Otomasi Las Panel',1,'2026-09-16','2026-09-18','08:00:00','17:00:00','Budi Santoso','081234567890','Agus','081298765432','Dina','087788990011',2,'Tinggi','Menunggu HSE',NULL,'QR-WP-2609-001-dESn5cQL','2026-09-12 13:24:20','2026-09-12 13:24:20',NULL),(5,'WP-2609-002',1,1,'Baru',NULL,'Uji Coba Otomasi Las Panel',1,'2026-09-16','2026-09-18','08:00:00','17:00:00','Budi Santoso','081234567890','Agus','081298765432','Dina','087788990011',2,'Tinggi','Menunggu HSE',NULL,'QR-WP-2609-002-IzKBzSPH','2026-09-12 13:29:04','2026-09-12 13:29:04',NULL),(6,'WP-2609-003',1,1,'Baru',NULL,'Uji Coba Otomasi Las Panel',1,'2026-09-16','2026-09-18','08:00:00','17:00:00','Budi Santoso','081234567890','Agus','081298765432','Dina','087788990011',2,'Tinggi','Menunggu HSE',NULL,'QR-WP-2609-003-OuDbRhPm','2026-09-12 15:18:58','2026-09-12 15:18:58',NULL),(7,'WP-2609-004',1,1,'Baru',NULL,'Uji Coba Otomasi Las Panel',1,'2026-09-16','2026-09-18','08:00:00','17:00:00','Budi Santoso','081234567890','Agus','081298765432','Dina','087788990011',2,'Tinggi','Menunggu HSE',NULL,'QR-WP-2609-004-m8CaiGHL','2026-09-12 15:24:40','2026-09-12 15:24:40',NULL),(8,'WP-2609-005',1,1,'Baru',NULL,'Uji Coba Otomasi Las Panel',1,'2026-09-16','2026-09-18','08:00:00','17:00:00','Budi Santoso','081234567890','Agus','081298765432','Dina','087788990011',2,'Tinggi','Menunggu HSE',NULL,'QR-WP-2609-005-KqvPsMCf','2026-09-12 15:50:07','2026-09-12 15:50:07',NULL);
/*!40000 ALTER TABLE `work_permits` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-14 10:06:07
