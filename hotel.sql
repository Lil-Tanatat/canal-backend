-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 07, 2026 at 12:01 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hotel`
--

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('new_repair','deadline_soon','deadline_passed') NOT NULL,
  `stuff_id` varchar(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` varchar(500) NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `stuff_id`, `title`, `body`, `is_read`, `created_at`) VALUES
(1, 1, 'new_repair', 'S0010005', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 1 ชิ้น', 1, '2026-06-04 01:00:27'),
(2, 2, 'new_repair', 'S0010005', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 1 ชิ้น', 0, '2026-06-04 01:00:27'),
(3, 4, 'new_repair', 'S0010005', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 1 ชิ้น', 0, '2026-06-04 01:00:27'),
(4, 6, 'new_repair', 'S0010005', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 1 ชิ้น', 1, '2026-06-04 01:00:27'),
(5, 1, 'new_repair', 'S0010005', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 1 ชิ้น', 1, '2026-06-04 01:32:29'),
(6, 2, 'new_repair', 'S0010005', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 1 ชิ้น', 0, '2026-06-04 01:32:29'),
(7, 4, 'new_repair', 'S0010005', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 1 ชิ้น', 0, '2026-06-04 01:32:29'),
(8, 6, 'new_repair', 'S0010005', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 1 ชิ้น', 0, '2026-06-04 01:32:29'),
(9, 1, 'new_repair', 'S0010006', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 4 ชิ้น', 1, '2026-06-04 01:32:48'),
(10, 2, 'new_repair', 'S0010006', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 4 ชิ้น', 0, '2026-06-04 01:32:48'),
(11, 4, 'new_repair', 'S0010006', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 4 ชิ้น', 0, '2026-06-04 01:32:48'),
(12, 6, 'new_repair', 'S0010006', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 4 ชิ้น', 0, '2026-06-04 01:32:48'),
(13, 1, 'new_repair', 'S0010006', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 2 ชิ้น', 1, '2026-06-07 00:23:54'),
(14, 2, 'new_repair', 'S0010006', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 2 ชิ้น', 0, '2026-06-07 00:23:54'),
(15, 4, 'new_repair', 'S0010006', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 2 ชิ้น', 0, '2026-06-07 00:23:54'),
(16, 6, 'new_repair', 'S0010006', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 2 ชิ้น', 0, '2026-06-07 00:23:54'),
(17, 1, 'new_repair', 'S0010006', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 4 ชิ้น', 1, '2026-06-07 00:24:15'),
(18, 2, 'new_repair', 'S0010006', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 4 ชิ้น', 0, '2026-06-07 00:24:15'),
(19, 4, 'new_repair', 'S0010006', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 4 ชิ้น', 0, '2026-06-07 00:24:15'),
(20, 6, 'new_repair', 'S0010006', '? งานซ่อมใหม่: a', 'a — แจ้งโดย admin จำนวน 4 ชิ้น', 0, '2026-06-07 00:24:15');

-- --------------------------------------------------------

--
-- Table structure for table `parts`
--

CREATE TABLE `parts` (
  `ID` varchar(11) NOT NULL,
  `Desc` varchar(255) NOT NULL,
  `Picture` varchar(255) NOT NULL,
  `Price` decimal(15,2) NOT NULL,
  `part_store` varchar(255) NOT NULL,
  `place` varchar(255) NOT NULL,
  `Date_of_Buy` datetime NOT NULL,
  `ETC` varchar(255) NOT NULL,
  `qty_new` int(11) DEFAULT 0,
  `qty_used` int(11) DEFAULT 0,
  `qty_damaged` int(11) DEFAULT 0,
  `qty_scrapped` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `push_subscriptions`
--

CREATE TABLE `push_subscriptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `endpoint` text NOT NULL,
  `p256dh` text NOT NULL,
  `auth` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `push_subscriptions`
--

INSERT INTO `push_subscriptions` (`id`, `user_id`, `endpoint`, `p256dh`, `auth`, `created_at`) VALUES
(2, 6, 'https://fcm.googleapis.com/fcm/send/fUTy97hsg84:APA91bGmd1QDPYFTpj03besXl8tDEA61kmRSobJH4XTyJCRip2RALyU7lvufMulJEoflpCBSm_U56Ao_dHEmS2ugLbvil90_zjfgTEldoKyg7xvuRrYMWQlX3t8DPrRXbwYon3I32R1g', 'BIXmnPgj6eM2mp03QhEP-axyAUrJpcUjLAdrUiCWOEvbA8_i8xk8RCQ4ofuzOimh6BiL930fjVhxdJxPyUlGPCE', 'dXG_EgN8vKpuTkKz4w4LZQ', '2026-06-04 01:05:09');

-- --------------------------------------------------------

--
-- Table structure for table `stuff_to_maintenance`
--

CREATE TABLE `stuff_to_maintenance` (
  `ID` varchar(11) NOT NULL,
  `Itemtype` varchar(255) NOT NULL,
  `Desc` varchar(255) NOT NULL,
  `Picture` varchar(255) NOT NULL,
  `Price` decimal(15,2) NOT NULL,
  `Place` varchar(255) NOT NULL,
  `State` enum('ok','broken','wait_for_repair') NOT NULL,
  `Date_of_Buy` datetime NOT NULL,
  `Date_of_Install` datetime NOT NULL,
  `ETC` varchar(255) NOT NULL,
  `qty_new` int(11) DEFAULT 0,
  `qty_used` int(11) DEFAULT 0,
  `qty_damaged` int(11) DEFAULT 0,
  `qty_scrapped` int(11) DEFAULT 0,
  `urgency` enum('low','medium','high') DEFAULT 'medium',
  `deadline` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `stuff_to_maintenance`
--

INSERT INTO `stuff_to_maintenance` (`ID`, `Itemtype`, `Desc`, `Picture`, `Price`, `Place`, `State`, `Date_of_Buy`, `Date_of_Install`, `ETC`, `qty_new`, `qty_used`, `qty_damaged`, `qty_scrapped`, `urgency`, `deadline`) VALUES
('S0010001', 'เครื่องใช้ไฟฟ้า', 'AUTO', '', 9.00, '101', 'ok', '2026-05-23 16:53:00', '2026-05-23 16:53:00', '', 5, 5, 0, 0, 'medium', NULL),
('S0010002', 'ไฟฟ้า', 'เก้าอิ้', '/uploads/stuff/S0010002.png', 0.00, 'ห้อง 101', 'ok', '2026-05-26 07:20:00', '2026-05-26 07:20:00', '', 0, 10, 0, 0, 'medium', NULL),
('S0010003', 'ไฟฟ้า', 'a', '', 1.00, 'a', 'ok', '2026-05-26 07:54:00', '2026-05-26 07:54:00', '', 1, 2, 0, 0, 'medium', NULL),
('S0010005', 'ประปา', 'a', '', 0.00, 'a', 'ok', '2026-05-26 08:27:00', '2026-05-26 08:27:00', '', 0, 3, 0, 0, 'medium', NULL),
('S0010006', 'ไฟฟ้า', 'a', '', 12.00, 'a', 'broken', '2026-05-29 17:45:00', '2026-05-29 17:45:00', '', 0, 0, 4, 0, 'low', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `support`
--

CREATE TABLE `support` (
  `ID` varchar(10) NOT NULL,
  `Desc` varchar(255) NOT NULL,
  `Place` varchar(255) NOT NULL,
  `Type` enum('electrical wiring','waterworks','appliances','air_wiring') NOT NULL,
  `Report` varchar(900) NOT NULL,
  `repair_details` varchar(900) NOT NULL,
  `Manual` varchar(900) NOT NULL,
  `ETC` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `support`
--

INSERT INTO `support` (`ID`, `Desc`, `Place`, `Type`, `Report`, `repair_details`, `Manual`, `ETC`) VALUES
('2605266779', 'ซ่อม: a', 'a', 'electrical wiring', 'แจ้งซ่อม จำนวน 2 ชิ้น', '', '', 'โดย: a (พนักงาน)'),
('2605263384', 'ซ่อม: a', 'a', 'waterworks', 'แจ้งซ่อม จำนวน 2 ชิ้น', '', '', 'โดย: a (พนักงาน)'),
('2605307659', 'ซ่อม: a', 'a', 'waterworks', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605301968', 'ซ่อม: a', 'a', 'waterworks', 'ซ่อมเสร็จ จำนวน 2 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605302596', 'ซ่อม: a', 'a', 'waterworks', 'แจ้งซ่อม จำนวน 2 ชิ้น', '', '', 'โดย: a (พนักงาน)'),
('2605305738', 'ซ่อม: a', 'a', 'electrical wiring', 'แจ้งซ่อม จำนวน 3 ชิ้น', '', '', 'โดย: a (พนักงาน)'),
('2605309097', 'ซ่อม: a', 'a', 'electrical wiring', 'แจ้งซ่อม จำนวน 1 ชิ้น', '', '', 'โดย: a (พนักงาน)'),
('2605307144', 'ซ่อม: เก้าอิ้', 'ห้อง 101', 'electrical wiring', 'แจ้งซ่อม จำนวน 5 ชิ้น', '', '', 'โดย: a (พนักงาน)'),
('2605303902', 'ซ่อม: AUTO', '101', 'appliances', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605308019', 'ซ่อม: AUTO', '101', 'appliances', 'ซ่อมเสร็จ จำนวน 5 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605302796', 'ซ่อม: เก้าอิ้', 'ห้อง 101', 'electrical wiring', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605318406', 'ซ่อม: a', 'a', 'electrical wiring', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605315172', 'ซ่อม: a', 'a', 'electrical wiring', 'ซ่อมเสร็จ จำนวน 1 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605319143', 'ซ่อม: a', 'a', 'electrical wiring', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605315896', 'ซ่อม: a', 'a', 'electrical wiring', 'ซ่อมเสร็จ จำนวน 3 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605313072', 'ซ่อม: a', 'a', 'electrical wiring', 'แจ้งซ่อม จำนวน 4 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605311634', 'ซ่อม: a', 'a', 'electrical wiring', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605318200', 'ซ่อม: a', 'a', 'electrical wiring', 'ซ่อมเสร็จ จำนวน 2 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605311349', 'ซ่อม: a', 'a', 'electrical wiring', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605313807', 'ซ่อม: a', 'a', 'electrical wiring', 'ซ่อมเสร็จ จำนวน 1 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605314429', 'ซ่อม: a', 'a', 'electrical wiring', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605318178', 'ซ่อม: a', 'a', 'electrical wiring', 'ซ่อมเสร็จ จำนวน 1 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605312334', 'ซ่อม: a', 'a', 'electrical wiring', 'แจ้งซ่อม จำนวน 4 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605314157', 'ซ่อม: a', 'a', 'waterworks', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605318530', 'ซ่อม: a', 'a', 'waterworks', 'ซ่อมเสร็จ จำนวน 2 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605310564', 'ซ่อม: a', 'a', 'electrical wiring', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605314703', 'ซ่อม: a', 'a', 'electrical wiring', 'ซ่อมเสร็จ จำนวน 2 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605310978', 'ซ่อม: เก้าอิ้', 'ห้อง 101', 'electrical wiring', 'ซ่อมเสร็จ จำนวน 10 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605315152', 'ซ่อม: a', 'a', 'electrical wiring', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605310775', 'ซ่อม: a', 'a', 'electrical wiring', 'ซ่อมเสร็จ จำนวน 3 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605313940', 'ซ่อม: a', 'a', 'electrical wiring', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605316118', 'ซ่อม: a', 'a', 'electrical wiring', 'ซ่อมเสร็จ จำนวน 1 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605311317', 'ซ่อม: a', 'a', 'electrical wiring', 'แจ้งซ่อม จำนวน 3 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605313898', 'ซ่อม: a', 'a', 'electrical wiring', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605310106', 'ซ่อม: a', 'a', 'electrical wiring', 'ซ่อมเสร็จ จำนวน 3 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2605313598', 'ซ่อม: a', 'a', 'electrical wiring', 'แจ้งซ่อม จำนวน 2 ชิ้น', '', '', 'โดย: a (พนักงาน)'),
('2605311643', 'ซ่อม: a', 'a', 'electrical wiring', 'แจ้งซ่อม จำนวน 2 ชิ้น', '', '', 'โดย: a (พนักงาน)'),
('2605311540', 'ซ่อม: a', 'a', 'waterworks', 'แจ้งซ่อม จำนวน 1 ชิ้น', '', '', 'โดย: a (พนักงาน)'),
('2605310738', 'ซ่อม: a', 'a', 'waterworks', 'แจ้งซ่อม จำนวน 2 ชิ้น', '', '', 'โดย: a (พนักงาน)'),
('2605313689', 'ซ่อม: a', 'a', 'waterworks', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605316801', 'ซ่อม: a', 'a', 'electrical wiring', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2605310366', 'ซ่อม: a', 'a', 'electrical wiring', 'ซ่อมเสร็จ จำนวน 4 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2606048304', 'ซ่อม: a', 'a', 'waterworks', 'ซ่อมเสร็จ จำนวน 3 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2606047815', 'ซ่อม: a', 'a', 'waterworks', 'แจ้งซ่อม จำนวน 1 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2606049815', 'ซ่อม: a', 'a', 'waterworks', 'รับงานซ่อม', '', '', 'โดย: T (ช่าง)'),
('2606042340', 'ซ่อม: a', 'a', 'waterworks', 'ซ่อมเสร็จ จำนวน 1 ชิ้น', '', '', 'โดย: T (ช่าง)'),
('2606049747', 'ซ่อม: a', 'a', 'waterworks', 'แจ้งซ่อม จำนวน 1 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2606043446', 'ซ่อม: a', 'a', 'waterworks', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2606041713', 'ซ่อม: a', 'a', 'waterworks', 'ซ่อมเสร็จ จำนวน 1 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2606048144', 'ซ่อม: a', 'a', 'electrical wiring', 'แจ้งซ่อม จำนวน 4 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2606043846', 'ซ่อม: a', 'a', 'electrical wiring', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2606047554', 'ซ่อม: a', 'a', 'electrical wiring', 'ซ่อมเสร็จ จำนวน 4 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2606074314', 'ซ่อม: a', 'a', 'electrical wiring', 'แจ้งซ่อม จำนวน 2 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2606073236', 'ซ่อม: a', 'a', 'electrical wiring', 'รับงานซ่อม', '', '', 'โดย: admin (แอดมิน)'),
('2606077298', 'ซ่อม: a', 'a', 'electrical wiring', 'ซ่อมเสร็จ จำนวน 2 ชิ้น', '', '', 'โดย: admin (แอดมิน)'),
('2606075251', 'ซ่อม: a', 'a', 'electrical wiring', 'แจ้งซ่อม จำนวน 4 ชิ้น', '', '', 'โดย: admin (แอดมิน)');

-- --------------------------------------------------------

--
-- Table structure for table `tool`
--

CREATE TABLE `tool` (
  `ID` varchar(11) NOT NULL,
  `Desc` varchar(255) NOT NULL,
  `Picture` varchar(255) NOT NULL,
  `Price` decimal(15,2) NOT NULL,
  `tool_store` varchar(255) NOT NULL,
  `place` varchar(255) NOT NULL,
  `Date_of_Buy` datetime NOT NULL,
  `ETC` int(255) NOT NULL,
  `qty_new` int(11) DEFAULT 0,
  `qty_used` int(11) DEFAULT 0,
  `qty_damaged` int(11) DEFAULT 0,
  `qty_scrapped` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('พนักงาน','ช่าง','แอดมิน') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', '$2a$10$v1nRpXutjAz2V4S3JTJhDOj.uWgptBBWhnEIEtCUEOPj3GfY4DqDm', 'แอดมิน'),
(2, 'admin2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'แอดมิน'),
(3, 'staff01', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'พนักงาน'),
(4, 'tech01', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ช่าง'),
(5, 'a', '$2a$10$NZ3duQs/RR4FjDYmRS5OA.cTspkISeUw5BufUyfIt5aIr746qH4WG', 'พนักงาน'),
(6, 'T', '$2a$10$CKYclSiWTtLkbZ9Eb6YGiuImfmNbp3dHfX.hePoaR/1GBDcAG5RDW', 'ช่าง');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_read` (`user_id`,`is_read`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
