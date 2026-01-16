-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 16, 2026 at 09:19 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `viros_web_new`
--

-- --------------------------------------------------------

--
-- Table structure for table `about_core_values`
--

CREATE TABLE `about_core_values` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` text DEFAULT NULL,
  `gradient` varchar(255) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `about_core_values`
--

INSERT INTO `about_core_values` (`id`, `title`, `description`, `icon`, `gradient`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'Quality Excellence', 'We provide professional-grade barcode equipment and solutions with superior performance and reliability.', '💡', 'from-[#06b6d4] to-[#06124f]', 0, '2026-01-13 05:01:17', '2026-01-13 05:01:17'),
(2, 'Technical Expertise', 'Our team brings deep technical knowledge in barcode technology and system integration.', '⭐', 'from-[#06124f] to-[#06b6d4]', 1, '2026-01-13 05:01:17', '2026-01-13 05:01:17'),
(3, 'Customer Success', 'We build lasting partnerships with our clients, ensuring operational efficiency.', '🎯', 'from-[#06b6d4] via-[#06124f] to-[#06b6d4]', 2, '2026-01-13 05:01:17', '2026-01-13 05:01:17'),
(4, 'Innovation Focus', 'We stay at the forefront of barcode technology, offering the latest solutions.', '🚀', 'from-[#06124f] via-[#06b6d4] to-[#06124f]', 3, '2026-01-13 05:01:17', '2026-01-13 05:01:17');

-- --------------------------------------------------------

--
-- Table structure for table `about_features`
--

CREATE TABLE `about_features` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `about_features`
--

INSERT INTO `about_features` (`id`, `title`, `description`, `icon`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'Label Printers', 'Professional-grade thermal and direct thermal barcode label printers.', '🖨️', 0, '2026-01-13 05:01:17', '2026-01-13 05:01:17'),
(2, 'Handheld Scanners', 'High-performance handheld barcode scanners with advanced reading capabilities.', '🔍', 1, '2026-01-13 05:01:17', '2026-01-13 05:01:17'),
(3, 'Mobile TABs & Devices', 'Rugged Android mobile computers and tablets with integrated barcode scanning.', '📱', 2, '2026-01-13 05:01:17', '2026-01-13 05:01:17'),
(4, 'Labels & Ribbons', 'Complete range of high-quality barcode labels and thermal transfer ribbons.', '🏷️', 3, '2026-01-13 05:01:17', '2026-01-13 05:01:17');

-- --------------------------------------------------------

--
-- Table structure for table `about_milestones`
--

CREATE TABLE `about_milestones` (
  `id` int(11) NOT NULL,
  `year` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `about_milestones`
--

INSERT INTO `about_milestones` (`id`, `year`, `title`, `description`, `display_order`, `created_at`, `updated_at`) VALUES
(1, '2018', 'Inception', 'VIROS Entrepreneurs was founded with a vision to simplify barcode solutions.', 0, '2026-01-13 05:01:17', '2026-01-13 05:01:17'),
(2, '2019', 'Strategic Partnerships', 'Secured key partnerships with major printer manufacturers.', 1, '2026-01-13 05:01:17', '2026-01-13 05:01:17'),
(3, '2021', 'National Expansion', 'Expanded operations to serve clients across 20+ states in India.', 2, '2026-01-13 05:01:17', '2026-01-13 05:01:17'),
(4, '2023', 'Innovation & Software', 'Launched our custom software development wing.', 3, '2026-01-13 05:01:17', '2026-01-13 05:01:17'),
(5, '2024', 'Market Leadership', 'Recognized as a top barcode solutions provider.', 4, '2026-01-13 05:01:17', '2026-01-13 05:01:17');

-- --------------------------------------------------------

--
-- Table structure for table `about_page_content`
--

CREATE TABLE `about_page_content` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `mission` text DEFAULT NULL,
  `vision` text DEFAULT NULL,
  `video_url` varchar(1024) DEFAULT NULL,
  `cta_title` varchar(255) DEFAULT NULL,
  `cta_subtitle` text DEFAULT NULL,
  `cta_primary_text` varchar(100) DEFAULT NULL,
  `cta_secondary_text` varchar(100) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `home_about_badge` varchar(100) DEFAULT 'WHO WE ARE',
  `home_about_title` varchar(255) DEFAULT 'Complete Barcode Solutions Provider',
  `home_about_description` text DEFAULT NULL,
  `home_about_image` varchar(1024) DEFAULT NULL,
  `home_about_card_title` varchar(255) DEFAULT 'Trusted Partner',
  `home_about_card_subtitle` varchar(255) DEFAULT 'Helping businesses scale since 2018',
  `homepage_badge` varchar(100) DEFAULT 'WHO WE ARE',
  `homepage_title` varchar(255) DEFAULT 'Complete Barcode Solutions Provider',
  `homepage_description` text DEFAULT 'VIROS Entrepreneurs specializes in providing comprehensive barcode solutions including label printers, handheld scanners, mobile devices, and custom software solutions. We enable businesses to achieve operational excellence through innovative technology.',
  `homepage_image_url` varchar(1024) DEFAULT 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  `homepage_card_title` varchar(100) DEFAULT 'Trusted Partner',
  `homepage_card_subtitle` varchar(255) DEFAULT 'Helping businesses scale since 2018'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `about_page_content`
--

INSERT INTO `about_page_content` (`id`, `title`, `subtitle`, `description`, `mission`, `vision`, `video_url`, `cta_title`, `cta_subtitle`, `cta_primary_text`, `cta_secondary_text`, `updated_at`, `home_about_badge`, `home_about_title`, `home_about_description`, `home_about_image`, `home_about_card_title`, `home_about_card_subtitle`, `homepage_badge`, `homepage_title`, `homepage_description`, `homepage_image_url`, `homepage_card_title`, `homepage_card_subtitle`) VALUES
(1, 'About VIROS Entrepreneurs', 'Complete Barcode Solutions Provider', 'VIROS Entrepreneurs specializes in providing comprehensive barcode solutions including label printers, handheld scanners, mobile devices, and custom software solutions for modern business operations.', 'We specialize in providing comprehensive barcode solutions that streamline business operations across industries. From thermal label printers to mobile scanning devices, we deliver professional-grade equipment and software solutions.', 'To be India\'s most trusted barcode solutions provider, delivering innovative technology and exceptional service that enables businesses to achieve operational excellence and competitive advantage.', '', 'Ready to Optimize Your Operations?', 'Get premium barcode labels, thermal ribbons, and professional printer services to streamline your business operations with VIROS Entrepreneurs.', 'Get Quote for Labels ok', 'View Products', '2026-01-13 05:30:11', 'WHO WE ARE', 'Complete Barcode Solutions Provider', NULL, NULL, 'Trusted Partner', 'Helping businesses scale since 2018', 'WHO WE ARE', 'Complete Barcode Solutions Provider', 'VIROS Entrepreneurs specializes in providing comprehensive barcode solutions including label printers, handheld scanners, mobile devices, and custom software solutions. We enable businesses to achieve operational excellence through innovative technology.', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Trusted Partners', 'Helping businesses scale since 2018');

-- --------------------------------------------------------

--
-- Table structure for table `about_stats`
--

CREATE TABLE `about_stats` (
  `id` int(11) NOT NULL,
  `label` varchar(255) NOT NULL,
  `value` varchar(100) NOT NULL,
  `icon` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `about_stats`
--

INSERT INTO `about_stats` (`id`, `label`, `value`, `icon`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'Happy Clients', '500+', 'Users', 0, '2026-01-13 05:01:17', '2026-01-13 05:03:12'),
(2, 'Projects Delivered', '1000+', 'Rocket', 1, '2026-01-13 05:01:17', '2026-01-13 05:33:08'),
(3, 'Cities Served', '50+', 'Target', 2, '2026-01-13 05:01:17', '2026-01-13 05:01:17'),
(4, 'Uptime Guarantee', '99.9%', 'Shield', 3, '2026-01-13 05:01:17', '2026-01-13 05:36:22');

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `issuer` varchar(255) NOT NULL,
  `year` varchar(10) NOT NULL,
  `image_url` varchar(1024) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `certificates`
--

INSERT INTO `certificates` (`id`, `title`, `issuer`, `year`, `image_url`, `description`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'ISO 9001:2015 Certification2025', 'International Organization for Standardization', '2024', 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80', 'Certified for Quality Management Systems in hardware distribution and service.', 1, 1, '2026-01-13 06:04:32', '2026-01-13 06:13:13'),
(2, 'Zebra Premier Business Partner', 'Zebra Technologies', '2022', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80', 'Recognized as a top-tier partner for delivering excellence in Zebra solutions.', 2, 1, '2026-01-13 06:04:32', '2026-01-13 06:04:32'),
(3, 'Honeywell Platinum Partner', 'Honeywell', '2023', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80', 'Awarded for outstanding performance in industrial automation and safety solutions.', 3, 1, '2026-01-13 06:04:32', '2026-01-13 06:04:32'),
(4, 'Excellence in Customer Service', 'Industry Awards 2023', '2023', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80', 'Voted best-in-class for client support and technical assistance.', 4, 1, '2026-01-13 06:04:32', '2026-01-13 06:04:32');

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo_url` varchar(1024) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `name`, `logo_url`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Reliance Retail', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png', 0, 1, '2026-01-13 04:54:29', '2026-01-13 04:54:29'),
(2, 'Tata Croma', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png', 1, 1, '2026-01-13 04:54:29', '2026-01-13 04:54:29'),
(3, 'D-Mart', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png', 2, 1, '2026-01-13 04:54:29', '2026-01-13 04:54:29'),
(4, 'Amazon India', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png', 3, 1, '2026-01-13 04:54:29', '2026-01-13 04:54:29'),
(5, 'Flipkart', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png', 4, 1, '2026-01-13 04:54:29', '2026-01-13 04:54:29'),
(6, 'BigBasket', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png', 5, 1, '2026-01-13 04:54:29', '2026-01-13 04:54:29'),
(7, 'Delhivery', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png', 6, 1, '2026-01-13 04:54:29', '2026-01-13 04:54:29'),
(8, 'Blue Dart', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png', 7, 1, '2026-01-13 04:54:29', '2026-01-13 04:54:29');

-- --------------------------------------------------------

--
-- Table structure for table `contact_departments`
--

CREATE TABLE `contact_departments` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `email_1` varchar(255) DEFAULT NULL,
  `email_2` varchar(255) DEFAULT NULL,
  `phone_1` varchar(255) DEFAULT NULL,
  `phone_2` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_departments`
--

INSERT INTO `contact_departments` (`id`, `title`, `description`, `email_1`, `email_2`, `phone_1`, `phone_2`, `created_at`, `updated_at`) VALUES
(1, 'Sales Department', 'Product inquiries, quotes, and new business', 'sales@virosentrepreneurs.com', 'marketing@virosentrepreneurs.com', '+91-987102-9141', '+91-987102-9142', '2026-01-13 09:38:07', '2026-01-13 09:38:07'),
(2, 'Technical Support', '10:00-6:00 support for existing customers', 'it@virosentrepreneurs.com', '', '+91-837792-9141', '', '2026-01-13 09:38:07', '2026-01-13 09:46:24'),
(3, 'AMC Services', 'Annual maintenance contracts and servicing', 'info@virosentrepreneurs.com', '', '+91-729096-9141', '', '2026-01-13 09:38:07', '2026-01-13 11:13:23'),
(4, 'Training Center', 'Product training and certification programs', 'helpdesk@virosentrepreneurs.com', NULL, '+91-874383-9141', NULL, '2026-01-13 09:38:07', '2026-01-13 09:38:07');

-- --------------------------------------------------------

--
-- Table structure for table `contact_page_content`
--

CREATE TABLE `contact_page_content` (
  `id` int(11) NOT NULL DEFAULT 1,
  `hero_title` varchar(255) DEFAULT 'Let''s Start a Conversation',
  `hero_description` text DEFAULT NULL,
  `general_phone` varchar(255) DEFAULT NULL,
  `general_email_support` varchar(255) DEFAULT NULL,
  `general_email_info` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `social_twitter` varchar(255) DEFAULT NULL,
  `social_linkedin` varchar(255) DEFAULT NULL,
  `social_facebook` varchar(255) DEFAULT NULL,
  `social_instagram` varchar(255) DEFAULT NULL,
  `social_youtube` varchar(255) DEFAULT NULL,
  `sales_email_1` varchar(255) DEFAULT NULL,
  `sales_email_2` varchar(255) DEFAULT NULL,
  `sales_phone_1` varchar(255) DEFAULT NULL,
  `sales_phone_2` varchar(255) DEFAULT NULL,
  `tech_email` varchar(255) DEFAULT NULL,
  `tech_phone` varchar(255) DEFAULT NULL,
  `amc_email` varchar(255) DEFAULT NULL,
  `amc_phone` varchar(255) DEFAULT NULL,
  `training_email` varchar(255) DEFAULT NULL,
  `training_phone` varchar(255) DEFAULT NULL,
  `care_title` varchar(255) DEFAULT 'Customer Care & Dispatch Related Inquiries',
  `care_description` text DEFAULT NULL,
  `care_email` varchar(255) DEFAULT NULL,
  `care_phone` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_page_content`
--

INSERT INTO `contact_page_content` (`id`, `hero_title`, `hero_description`, `general_phone`, `general_email_support`, `general_email_info`, `address`, `social_twitter`, `social_linkedin`, `social_facebook`, `social_instagram`, `social_youtube`, `sales_email_1`, `sales_email_2`, `sales_phone_1`, `sales_phone_2`, `tech_email`, `tech_phone`, `amc_email`, `amc_phone`, `training_email`, `training_phone`, `care_title`, `care_description`, `care_email`, `care_phone`, `updated_at`) VALUES
(1, 'Let\'s Start a Conversation', 'Have a question about our products or services? We\'re here to help you find the perfect solution for your business.', '+91 98765 43210', 'customercare@virosentrepreneurs.com', 'info@virosentrepreneurs.com', '25/2, Block B, Molarband Extension\n Badarpur, New Delhi, Delhi 110044', '#', 'https://www.linkedin.com/company/viros-entrepreneurs/?viewAsMember=true', '#', '#', 'https://www.youtube.com/@piyushgargdev', 'sales@virosentrepreneurs.com', 'marketing@virosentrepreneurs.com', '+91-987102-9141', '+91-987102-9142', 'it@virosentrepreneurs.com', '+91-837792-9141', 'info@virosentrepreneurs.com', '+91-730377-9141', 'helpdesk@virosentrepreneurs.com', '+91-874383-9141', 'Customer Care & Dispatch Related Inquiries', 'We are committed to providing the best experience. If your query includes dispatch issues or hasn\'t been resolved, please contact our dedicated team.', 'customercare@virosentrepreneurs.com', '+91-874383-9141', '2026-01-13 11:12:26');

-- --------------------------------------------------------

--
-- Table structure for table `footer_content`
--

CREATE TABLE `footer_content` (
  `id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `copyright_text` varchar(255) DEFAULT 'VIROS Entrepreneurs. All rights reserved.',
  `developer_text` varchar(255) DEFAULT 'Developed and maintained by Viros Software Team',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `footer_content`
--

INSERT INTO `footer_content` (`id`, `description`, `copyright_text`, `developer_text`, `created_at`, `updated_at`) VALUES
(1, 'Empowering businesses with cutting-edge AIDC solutions. From barcode printers to enterprise mobility, we deliver efficiency and reliability.', 'VIROS Entrepreneurs. All rights reserved.', 'Developed and maintained by Viros Software Team.', '2026-01-13 10:16:47', '2026-01-13 10:21:40');

-- --------------------------------------------------------

--
-- Table structure for table `hero_slides`
--

CREATE TABLE `hero_slides` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `image` varchar(1024) NOT NULL,
  `cta` varchar(255) DEFAULT 'Browse Products',
  `cta_secondary` varchar(255) DEFAULT 'Get Quote',
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hero_slides`
--

INSERT INTO `hero_slides` (`id`, `title`, `subtitle`, `description`, `image`, `cta`, `cta_secondary`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Transform Your Business with AIDC Solutions', 'Industry-Leading Technology', 'From barcode scanners to complete inventory management systems, we provide cutting-edge Auto-ID and Data Capture solutions tailored to your business needs.', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', 'Browse Products', 'Get Quote', 1, 1, '2026-01-13 04:53:55', '2026-01-13 04:53:55'),
(2, 'Premium Hardware Solutions', 'Built for Performance', 'Industrial-grade barcode printers, scanners, and mobile computers designed for the toughest environments. Partner with industry leaders like Zebra and Honeywell.', 'https://images.unsplash.com/photo-1596658591534-591d75e2f2f7?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'View Hardware', 'Contact Sales', 2, 1, '2026-01-13 04:53:55', '2026-01-13 11:08:02'),
(3, 'Expert Support & Services', '24/7 Technical Support', 'From installation to maintenance, our certified technicians ensure your AIDC infrastructure runs smoothly. Annual Maintenance Contracts available nationwide.', 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', 'Our Services', 'Get Support', 3, 1, '2026-01-13 04:53:55', '2026-01-13 04:53:55');

-- --------------------------------------------------------

--
-- Table structure for table `legal_content`
--

CREATE TABLE `legal_content` (
  `id` int(11) NOT NULL,
  `privacy_policy` longtext DEFAULT NULL,
  `terms_of_service` longtext DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `legal_content`
--

INSERT INTO `legal_content` (`id`, `privacy_policy`, `terms_of_service`, `updated_at`) VALUES
(1, '\n<p class=\"mb-6\">Last updated: 13/1/2026</p>\n<p class=\"mb-6\">VIROS Entrepreneurs (\"we,\" \"our,\" or \"us\") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by VIROS Entrepreneurs.</p>\n\n<h2 class=\"text-2xl font-bold text-[#06124f] mt-8 mb-4\">1. Information We Collect</h2>\n<p class=\"mb-4\">We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.</p>\n\n<h2 class=\"text-2xl font-bold text-[#06124f] mt-8 mb-4\">2. How We Use Your Information</h2>\n<p class=\"mb-4\">We use the information we collect to provide, maintain, and improve our services, such as to:</p>\n<ul class=\"list-disc pl-6 mb-4 space-y-2\">\n    <li>Process and facilitate payments and operations.</li>\n    <li>Send you related information, including confirmations, invoices, technical notices, updates, security alerts, and support and administrative messages.</li>\n    <li>Communicate with you about products, services, promotions, news, and events offered by VIROS Entrepreneurs.</li>\n    <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities.</li>\n</ul>\n\n<h2 class=\"text-2xl font-bold text-[#06124f] mt-8 mb-4\">3. Sharing of Information</h2>\n<p class=\"mb-4\">We may share relevant information with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>\n\n<h2 class=\"text-2xl font-bold text-[#06124f] mt-8 mb-4\">4. Security</h2>\n<p class=\"mb-4\">We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration, and destruction.</p>\n\n<h2 class=\"text-2xl font-bold text-[#06124f] mt-8 mb-4\">5. Contact Us</h2>\n<p class=\"mb-4\">If you have any questions about this Privacy Policy, please contact us at: <a href=\"mailto:info@virosentrepreneurs.com\" class=\"text-[#06b6d4] hover:underline\">info@virosentrepreneurs.com</a>.</p>\n', '\n<p class=\"mb-6\">Last updated: 13/1/2026</p>\n<p class=\"mb-6\">Please read these Terms of Service (\"Terms\", \"Terms of Service\") carefully before using the VIROS Entrepreneurs website and services operated by VIROS Entrepreneurs (\"us\", \"we\", or \"our\").</p>\n\n<h2 class=\"text-2xl font-bold text-[#06124f] mt-8 mb-4\">1. Acceptance of Terms</h2>\n<p class=\"mb-4\">By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p>\n\n<h2 class=\"text-2xl font-bold text-[#06124f] mt-8 mb-4\">2. Intellectual Property</h2>\n<p class=\"mb-4\">The Service and its original content, features, and functionality are and will remain the exclusive property of VIROS Entrepreneurs and its licensors. The Service is protected by copyright, trademark, and other laws of both India and foreign countries.</p>\n\n<h2 class=\"text-2xl font-bold text-[#06124f] mt-8 mb-4\">3. Links To Other Web Sites</h2>\n<p class=\"mb-4\">Our Service may contain links to third-party web sites or services that are not owned or controlled by VIROS Entrepreneurs. We has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services.</p>\n\n<h2 class=\"text-2xl font-bold text-[#06124f] mt-8 mb-4\">4. Termination</h2>\n<p class=\"mb-4\">We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>\n\n<h2 class=\"text-2xl font-bold text-[#06124f] mt-8 mb-4\">5. Limitation of Liability</h2>\n<p class=\"mb-4\">In no event shall VIROS Entrepreneurs, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>\n\n<h2 class=\"text-2xl font-bold text-[#06124f] mt-8 mb-4\">6. Changes</h2>\n<p class=\"mb-4\">We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.</p>\n\n<h2 class=\"text-2xl font-bold text-[#06124f] mt-8 mb-4\">7. Contact Us</h2>\n<p class=\"mb-4\">If you have any questions about these Terms, please contact us at: <a href=\"mailto:info@virosentrepreneurs.com\" class=\"text-[#06b6d4] hover:underline\">info@virosentrepreneurs.com</a>.</p>\n', '2026-01-13 10:42:53');

-- --------------------------------------------------------

--
-- Table structure for table `navbar_content`
--

CREATE TABLE `navbar_content` (
  `id` int(11) NOT NULL,
  `logo_url` varchar(255) DEFAULT '/logo.png',
  `brand_title` varchar(100) DEFAULT 'VIROS',
  `brand_subtitle` varchar(100) DEFAULT 'Entrepreneurs',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `navbar_content`
--

INSERT INTO `navbar_content` (`id`, `logo_url`, `brand_title`, `brand_subtitle`, `created_at`, `updated_at`) VALUES
(1, '/logo.png', 'VIROS Entrepreneurs', 'IT Solutions Pvt. Ltd.', '2026-01-13 10:12:24', '2026-01-13 11:14:59');

-- --------------------------------------------------------

--
-- Table structure for table `partners`
--

CREATE TABLE `partners` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo_url` varchar(1024) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `partners`
--

INSERT INTO `partners` (`id`, `name`, `logo_url`, `category`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Honeywell', 'https://logos-world.net/wp-content/uploads/2021/02/Honeywell-Emblem.png', 'Hardware', 0, 1, '2026-01-13 04:54:41', '2026-01-13 04:54:41'),
(2, 'Zebra Technologies', 'https://logowik.com/content/uploads/images/zebra-technologies2902.jpg', 'Hardware', 1, 1, '2026-01-13 04:54:41', '2026-01-13 04:54:41'),
(3, 'TSC Printers', 'https://www.tscprinters.com/media/wysiwyg/TSC_logo.png', 'Hardware', 2, 1, '2026-01-13 04:54:41', '2026-01-13 04:54:41'),
(4, 'Sato', 'https://www.satoeurope.com/wp-content/uploads/2020/03/sato-logo.png', 'Hardware', 3, 1, '2026-01-13 04:54:41', '2026-01-13 04:54:41');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `image_url` varchar(1024) DEFAULT NULL,
  `theme_color` varchar(255) DEFAULT 'from-[#06124f] to-[#06b6d4]',
  `specs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`specs`)),
  `is_featured` tinyint(1) DEFAULT 0,
  `price_display` varchar(100) DEFAULT NULL,
  `stock_status` enum('In Stock','Low Stock','Out of Stock') DEFAULT 'In Stock',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `slug`, `name`, `category`, `description`, `tagline`, `image_url`, `theme_color`, `specs`, `is_featured`, `price_display`, `stock_status`, `created_at`, `updated_at`) VALUES
(1, 'industrial-label-printer-zt411', 'Industrial Label Printer', 'Printers', 'Robust industrial printing offered in a durable metal frame. Ideal for manufacturing and logistics.', 'Rugged Durability for Demanding Applications', 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80', 'from-[#06b6d4] to-[#06124f]', '[\"Thermal Transfer\",\"203/300/600 dpi\",\"Metal Frame\"]', 1, NULL, 'In Stock', '2026-01-13 04:54:18', '2026-01-13 04:56:42'),
(2, 'handheld-scanner-ds2200', 'Handheld Scanner DS2200', 'Scanners', 'Affordable 1D/2D imager that doesn\'t compromise on performance or features.', 'Unmatched Scanning Performance', 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=800&q=80', 'from-[#06b6d4] via-[#06124f] to-[#06b6d4]', '[\"1D/2D Decoding\",\"Bluetooth\",\"30-hour battery\"]', 1, NULL, 'In Stock', '2026-01-13 04:54:18', '2026-01-13 04:54:18'),
(3, 'enterprise-pda-mc9300', 'Enterprise PDA MC9300', 'Mobility', 'The ultimate ultra-rugged mobile touch computer for demanding environments.', 'Enterprise Mobile Computing Redefined', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80', 'from-[#06124f] to-[#06b6d4]', '[\"Android OS\",\"IP67 Rated\",\"7000mAh Battery\"]', 1, NULL, 'In Stock', '2026-01-13 04:54:18', '2026-01-13 04:54:18'),
(4, 'zebra', 'Zebra TC21', 'Scanners', 'Screen Size: 5 inches (12.7 cm)\nConnectivity: Bluetooth (WPAN), Wi-Fi (WLAN), SIM (one nano slot)\nMemory: 3 GB RAM/32 GB Flash, 4 GB RAM/64 GB Flash\nOperating System: Upgradeable to Android™ 14\nBattery Capacity: standards: 12.54 Wh (≥ 3,300 mAh), Extended: 20.25 Wh (5,260 mAh)', 'Order and Returns Processing  Ticketing  Buy Online Pickup in Store  Assisted Selling  Inventory Management', 'https://www.zebra.com/content/dam/zebra_dam/global/zcom-web-production/web-production-photography/product-cards/model/tc21-3x2-3600.jpg', 'from-[#06b6d4] to-[#06124f]', '[\"Bluetooth (WPAN)\",\"Wi-Fi (WLAN)\",\"SIM (one nano slot)\",\"3 GB RAM/32 GB Flash\",\"4 GB RAM/64 GB Flash\",\"Retail, General Purpose\"]', 1, '28000', 'In Stock', '2026-01-16 04:51:02', '2026-01-16 04:51:30');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `description` text DEFAULT NULL,
  `long_description` text DEFAULT NULL,
  `image_url` varchar(1024) DEFAULT NULL,
  `icon_name` varchar(100) DEFAULT NULL,
  `gradient` varchar(255) DEFAULT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `benefits` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`benefits`)),
  `specifications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`specifications`)),
  `process` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`process`)),
  `faqs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`faqs`)),
  `brands` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`brands`)),
  `products` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`products`)),
  `useCases` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`useCases`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `slug`, `title`, `status`, `description`, `long_description`, `image_url`, `icon_name`, `gradient`, `features`, `benefits`, `specifications`, `process`, `faqs`, `brands`, `products`, `useCases`, `created_at`, `updated_at`) VALUES
(1, 'hardware', 'Hardware Solutions GO', 'Active', 'Premium barcode printers, scanners, and mobile computing devices for industrial and retail environments.', 'Our Hardware Solutions provide robust and reliable AIDC equipment tailored for high-demand environments. From rugged industrial printers capable of 24/7 operation to versatile handheld scanners that streamline inventory management, we partner with leading global brands to ensure you get the best hardware for your specific operational needs. We offer comprehensive installation and configuration services to ensure seamless integration with your existing systems.', 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Printer', 'from-[#06b6d4] to-[#06124f]', '[\"Industrial Label Printers\",\"Handheld Barcode Scanners\",\"Mobile Computers (PDA)\",\"RFID Readers\"]', '[{\"title\":\"Increased Accuracy\",\"description\":\"Eliminate manual data entry errors with precision scanning and printing.\"},{\"title\":\"Durability\",\"description\":\"Equipment designed to withstand harsh industrial environments, drops, and dust.\"},{\"title\":\"Productivity\",\"description\":\"Faster processing times for inventory audits, shipping, and receiving.\"},{\"title\":\"Connectivity\",\"description\":\"Seamless integration with Wi-Fi, Bluetooth, and 5G networks for real-time data sync.\"}]', '[{\"label\":\"Printer Types\",\"value\":\"Industrial, Desktop, Mobile, RFID\"},{\"label\":\"Scanner Tech\",\"value\":\"1D Laser, 2D Imager, DPM\"},{\"label\":\"Connectivity\",\"value\":\"USB, Ethernet, Wi-Fi 6, Bluetooth 5.0\"},{\"label\":\"Supported Brands\",\"value\":\"Zebra, Honeywell, TSC, Sato\"}]', '[{\"step\":1,\"title\":\"Assessment\",\"description\":\"We evaluate your current workflow and environmental conditions.\"},{\"step\":2,\"title\":\"Selection\",\"description\":\"Recommending the best hardware mix for your specific budget and needs.\"},{\"step\":3,\"title\":\"Deployment\",\"description\":\"On-site installation, configuration, and network integration.\"},{\"step\":4,\"title\":\"Training\",\"description\":\"Hands-on training for your staff on device operation and basic troubleshooting.\"}]', '[{\"question\":\"What warranty comes with the hardware?\",\"answer\":\"Most devices come with a standard 1-3 year manufacturer warranty. We also offer extended comprehensive coverage.\"},{\"question\":\"Can these devices integrate with my ERP?\",\"answer\":\"Yes, our hardware is compatible with SAP, Oracle, Microsoft Dynamics, and most custom ERPs via standard drivers and APIs.\"},{\"question\":\"Do you provide demo units for testing?\",\"answer\":\"Absolutely! We offer free demo units for qualified businesses to test in their actual working environment before purchase.\"}]', '[{\"name\":\"Zebra Technologies\",\"logo\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Zebra_Technologies_logo.svg/320px-Zebra_Technologies_logo.svg.png\"},{\"name\":\"Honeywell\",\"logo\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Honeywell_logo.svg/320px-Honeywell_logo.svg.png\"},{\"name\":\"TSC Printers\",\"logo\":\"https://www.tscprinters.com/media/wysiwyg/TSC_logo.png\"},{\"name\":\"Sato\",\"logo\":\"https://www.satoeurope.com/wp-content/uploads/2020/03/sato-logo.png\"}]', '[{\"name\":\"Zebra ZT411 Industrial Printer\",\"description\":\"High-performance 4-inch industrial printer with 300 dpi resolution, ideal for manufacturing and logistics.\",\"image\":\"https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Industrial Printer\"},{\"name\":\"Honeywell Granit 1991i Scanner\",\"description\":\"Ultra-rugged 2D imager scanner designed for extreme environments with superior scan performance.\",\"image\":\"https://images.unsplash.com/photo-1588508065123-287b28e013da?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Barcode Scanner\"},{\"name\":\"Zebra TC52 Mobile Computer\",\"description\":\"Android-based mobile computer with advanced data capture for retail and field operations.\",\"image\":\"https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Mobile Computer\"},{\"name\":\"TSC TTP-247 Desktop Printer\",\"description\":\"Compact and affordable desktop thermal printer perfect for small to medium businesses.\",\"image\":\"https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Desktop Printer\"}]', '[{\"industry\":\"Manufacturing\",\"scenario\":\"Track work-in-progress inventory across production lines\",\"solution\":\"Deployed Zebra industrial printers and handheld scanners for real-time tracking\"},{\"industry\":\"Retail\",\"scenario\":\"Streamline checkout and inventory management\",\"solution\":\"Implemented POS-integrated barcode scanners and mobile computers\"},{\"industry\":\"Logistics\",\"scenario\":\"Improve warehouse picking accuracy and speed\",\"solution\":\"Provided rugged mobile computers with voice-directed picking software\"}]', '2026-01-13 04:54:18', '2026-01-13 04:57:26'),
(2, 'software', 'Software Solutions', 'Active', 'Custom software for inventory management, asset tracking, and point-of-sale integration.', 'Unlock the power of data with our custom Software Solutions. We design and develop intelligent software platforms that give you real-time visibility into your inventory, assets, and sales. Whether you need a standalone WMS or a module that integrates with your ERP, our software team builds scalable, user-friendly applications that drive efficiency and reduce error rates across your supply chain.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Code', 'from-[#06124f] to-[#06b6d4]', '[\"Inventory Management System\",\"Asset Tracking Software\",\"Warehouse Management (WMS)\",\"Custom Integration APIs\"]', '[{\"title\":\"Real-time Visibility\",\"description\":\"Track stock levels, location, and movement in real-time.\"},{\"title\":\"Automated Reporting\",\"description\":\"Generate detailed reports on stock aging, turnover, and discrepancies.\"},{\"title\":\"Scalability\",\"description\":\"Cloud-based architecture that grows with your business needs.\"},{\"title\":\"User-Friendly Interface\",\"description\":\"Intuitive designs that require minimal training for warehouse staff.\"}]', '[{\"label\":\"Deployment\",\"value\":\"Cloud (AWS/Azure) or On-Premise\"},{\"label\":\"Compatibility\",\"value\":\"Windows, Android, iOS, Web\"},{\"label\":\"Database\",\"value\":\"SQL Server, PostgreSQL, MongoDB\"},{\"label\":\"Integration\",\"value\":\"REST APIs, SOAP, Webhooks\"}]', '[{\"step\":1,\"title\":\"Requirement Gathering\",\"description\":\"Detailed sessions to understand your business logic and pain points.\"},{\"step\":2,\"title\":\"Prototyping\",\"description\":\"Creating clickable prototypes to visualize the solution before coding.\"},{\"step\":3,\"title\":\"Development\",\"description\":\"Agile development with regular feedback loops and testing.\"},{\"step\":4,\"title\":\"Go-Live & Support\",\"description\":\"Smooth deployment with post-launch hypercare and updates.\"}]', '[{\"question\":\"Is the software customizable?\",\"answer\":\"Absolutely. We build solutions from the ground up or customize existing modules to fit your exact workflow.\"},{\"question\":\"Is my data secure?\",\"answer\":\"We implement industry-standard encryption, role-based access control, and regular backups to ensure data security.\"},{\"question\":\"What is the typical development timeline?\",\"answer\":\"Depending on complexity, projects range from 2-6 months. We provide detailed timelines after requirement analysis.\"}]', '[{\"name\":\"Microsoft Azure\",\"logo\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Microsoft_Azure.svg/320px-Microsoft_Azure.svg.png\"},{\"name\":\"Amazon Web Services\",\"logo\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/320px-Amazon_Web_Services_Logo.svg.png\"},{\"name\":\"SAP\",\"logo\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/SAP_2011_logo.svg/320px-SAP_2011_logo.svg.png\"},{\"name\":\"Oracle\",\"logo\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Oracle_logo.svg/320px-Oracle_logo.svg.png\"}]', '[{\"name\":\"VirosTrack WMS\",\"description\":\"Complete warehouse management system with bin location tracking, pick-pack-ship workflows, and real-time dashboards.\",\"image\":\"https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Warehouse Management\"},{\"name\":\"AssetGuard Pro\",\"description\":\"Enterprise asset tracking solution with RFID integration, depreciation tracking, and maintenance scheduling.\",\"image\":\"https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Asset Management\"},{\"name\":\"RetailSync POS\",\"description\":\"Modern point-of-sale system with inventory sync, customer loyalty programs, and multi-store support.\",\"image\":\"https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Point of Sale\"},{\"name\":\"Custom API Gateway\",\"description\":\"Middleware solution for seamless integration between legacy systems and modern cloud applications.\",\"image\":\"https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Integration\"}]', '[{\"industry\":\"E-commerce\",\"scenario\":\"Sync inventory across multiple sales channels\",\"solution\":\"Built custom API integration connecting Shopify, Amazon, and internal WMS\"},{\"industry\":\"Healthcare\",\"scenario\":\"Track medical equipment and supplies across facilities\",\"solution\":\"Developed RFID-based asset tracking system with compliance reporting\"},{\"industry\":\"Distribution\",\"scenario\":\"Optimize warehouse picking routes and reduce errors\",\"solution\":\"Implemented WMS with AI-powered route optimization and voice picking\"}]', '2026-01-13 04:54:18', '2026-01-13 04:54:18'),
(3, 'consumables', 'Consumables', 'Active', 'High-quality thermal transfer ribbons and labels designed for durability and print clarity.', 'The quality of your labels and ribbons directly impacts the readability and longevity of your barcodes. We supply a wide range of consumables including Chromo paper labels, TT ribbons (Wax, Wax-Resin, Resin), and specialized asset tags for extreme environments. Our consumables are tested for compatibility with all major printer brands to ensure consistent, high-quality print output.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Tags', 'from-[#06b6d4] via-[#06124f] to-[#06b6d4]', '[\"Thermal Transfer Ribbons\",\"Direct Thermal Labels\",\"Polyester & Asset Tags\",\"Custom Pre-printed Labels\"]', '[{\"title\":\"Print Clarity\",\"description\":\"High-contrast printing for 100% scan rates.\"},{\"title\":\"Longevity\",\"description\":\"Labels that resist fading, scratching, and chemical exposure.\"},{\"title\":\"Printhead Protection\",\"description\":\"Premium ribbons that extend the life of your thermal printheads.\"},{\"title\":\"Customization\",\"description\":\"Any size, color, or pre-printed logo available on request.\"}]', '[{\"label\":\"Label Materials\",\"value\":\"Paper, Polyester, Polypropylene, Vinyl\"},{\"label\":\"Ribbon Types\",\"value\":\"Wax, Wax-Resin, Full Resin\"},{\"label\":\"Core Sizes\",\"value\":\"0.5 inch, 1 inch, 3 inch\"},{\"label\":\"Adhesives\",\"value\":\"Permanent, Removable, Freezer-grade\"}]', '[{\"step\":1,\"title\":\"Sample Testing\",\"description\":\"We provide samples to test adhesion and print durability in your environment.\"},{\"step\":2,\"title\":\"Quotation\",\"description\":\"Competitive pricing based on volume and specifications.\"},{\"step\":3,\"title\":\"Production\",\"description\":\"Precision manufacturing with strict quality control checks.\"},{\"step\":4,\"title\":\"Delivery\",\"description\":\"Timely delivery with options for scheduled restocking.\"}]', '[{\"question\":\"What ribbon should I use for glossy labels?\",\"answer\":\"For glossy synthetic labels (like polyester), a Resin ribbon is required for durability and smudge resistance.\"},{\"question\":\"Do you offer minimum order quantities?\",\"answer\":\"We support businesses of all sizes, but bulk orders attract significant volume discounts.\"},{\"question\":\"Can I get custom sizes?\",\"answer\":\"Yes! We manufacture labels in any custom size, shape, and color to meet your exact requirements.\"}]', '[]', '[{\"name\":\"Premium Wax Ribbons\",\"description\":\"Cost-effective ribbons for standard paper labels. Ideal for shipping labels and general-purpose applications.\",\"image\":\"https://images.unsplash.com/photo-1586075010923-2dd4570fb338?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Thermal Ribbon\"},{\"name\":\"Wax-Resin Hybrid Ribbons\",\"description\":\"Enhanced durability for synthetic labels. Perfect for product labeling and outdoor use.\",\"image\":\"https://images.unsplash.com/photo-1586075010923-2dd4570fb338?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Thermal Ribbon\"},{\"name\":\"Polyester Asset Tags\",\"description\":\"Ultra-durable tags for IT assets, machinery, and equipment. Resistant to chemicals and extreme temperatures.\",\"image\":\"https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Asset Tag\"},{\"name\":\"Custom Pre-printed Labels\",\"description\":\"Labels with your logo, warning symbols, or fixed text. Available in rolls or sheets.\",\"image\":\"https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Custom Label\"}]', '[{\"industry\":\"Food & Beverage\",\"scenario\":\"Labels for freezer storage and cold chain\",\"solution\":\"Supplied freezer-grade adhesive labels with resin ribbons\"},{\"industry\":\"Automotive\",\"scenario\":\"Durable part identification labels\",\"solution\":\"Provided polyester labels with chemical-resistant coating\"},{\"industry\":\"Pharmaceuticals\",\"scenario\":\"Compliance labeling with variable data\",\"solution\":\"Custom pre-printed labels with thermal overprinting capability\"}]', '2026-01-13 04:54:18', '2026-01-13 04:54:18'),
(4, 'support', 'Support & Maintenance', 'Active', 'Comprehensive after-sales support, annual maintenance contracts (AMC), and on-site repairs.', 'Downtime costs money. Our Support & Maintenance services are designed to keep your operations running smoothly. We offer flexible Annual Maintenance Contracts (AMC), rapid response on-site repair, and remote troubleshooting. Our certified technicians are experts in diagnosing and fixing issues with barcode printers, scanners, and mobile computers, extending the lifecycle of your hardware investment.', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Settings', 'from-[#06124f] via-[#06b6d4] to-[#06124f]', '[\"Annual Maintenance Contracts\",\"On-site Installation\",\"Printer Repair Services\",\"Remote Technical Support\"]', '[{\"title\":\"Minimized Downtime\",\"description\":\"Quick turnaround times on repairs to keep your business moving.\"},{\"title\":\"Predictable Costs\",\"description\":\"Fixed-cost AMC plans eliminate surprise repair bills.\"},{\"title\":\"Expertise\",\"description\":\"Access to factory-trained technicians with genuine spare parts.\"},{\"title\":\"Lifecycle Management\",\"description\":\"Advice on when to repair versus when to upgrade aging equipment.\"}]', '[{\"label\":\"Response Time\",\"value\":\"4-24 Hours (Depending on SLA)\"},{\"label\":\"Coverage Area\",\"value\":\"Pan-India On-site Support\"},{\"label\":\"Support Channels\",\"value\":\"Phone, Email, Remote Desktop, On-site\"},{\"label\":\"Spare Parts\",\"value\":\"100% Genuine OEM Parts\"}]', '[{\"step\":1,\"title\":\"Issue Logging\",\"description\":\"Log a ticket via our portal or hotline.\"},{\"step\":2,\"title\":\"Diagnosis\",\"description\":\"Initial remote diagnosis to identify the problem.\"},{\"step\":3,\"title\":\"Resolution\",\"description\":\"On-site visit by an engineer or instructions for ship-in repair.\"},{\"step\":4,\"title\":\"Verification\",\"description\":\"Testing the verified device and closing the ticket.\"}]', '[{\"question\":\"What is covered under AMC?\",\"answer\":\"Our standard AMC covers all service charges and routine preventative maintenance. Spare parts can be included in comprehensive plans.\"},{\"question\":\"Do you repair discontinued models?\",\"answer\":\"Yes, subject to spare parts availability. We try our best to keep your legacy systems running.\"},{\"question\":\"Can I upgrade my AMC plan mid-year?\",\"answer\":\"Absolutely! You can upgrade from Basic to Comprehensive at any time with prorated pricing.\"}]', '[{\"name\":\"Zebra Certified\",\"logo\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Zebra_Technologies_logo.svg/320px-Zebra_Technologies_logo.svg.png\"},{\"name\":\"Honeywell Authorized\",\"logo\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Honeywell_logo.svg/320px-Honeywell_logo.svg.png\"},{\"name\":\"TSC Partner\",\"logo\":\"https://www.tscprinters.com/media/wysiwyg/TSC_logo.png\"},{\"name\":\"Sato Certified\",\"logo\":\"https://www.satoeurope.com/wp-content/uploads/2020/03/sato-logo.png\"}]', '[{\"name\":\"Basic AMC Plan\",\"description\":\"Annual preventive maintenance with priority support. Excludes spare parts.\",\"image\":\"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Service Plan\"},{\"name\":\"Comprehensive AMC\",\"description\":\"All-inclusive plan covering labor, parts, and unlimited service calls.\",\"image\":\"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Service Plan\"},{\"name\":\"On-Demand Repair\",\"description\":\"Pay-per-incident repair service with 24-48 hour response time.\",\"image\":\"https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Service Plan\"},{\"name\":\"Remote Support Package\",\"description\":\"Unlimited remote troubleshooting and software updates for your devices.\",\"image\":\"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Service Plan\"}]', '[{\"industry\":\"Manufacturing\",\"scenario\":\"24/7 production line with zero tolerance for downtime\",\"solution\":\"Deployed comprehensive AMC with 4-hour on-site response guarantee\"},{\"industry\":\"Retail Chain\",\"scenario\":\"Multi-location POS and printer support\",\"solution\":\"Centralized helpdesk with regional technician network\"},{\"industry\":\"Logistics\",\"scenario\":\"Fleet of mobile computers requiring regular maintenance\",\"solution\":\"Quarterly preventive maintenance visits with swap device program\"}]', '2026-01-13 04:54:18', '2026-01-13 04:54:18'),
(5, 'rental', 'Laptop & Desktop Rental', 'Active', 'Scale your workforce instantly with our flexible high-performance IT equipment rental solutions.', 'Avoid heavy capital expenditure with our IT Rental Services. Whether you need equipment for a short-term project, a training event, or to scale up for peak season, we provide high-performance Laptops, Desktops, Servers, and Workstations on flexible rental terms. All equipment is quality-tested, pre-configured to your specifications, and supported by our 24/7 replacement guarantee.', 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Monitor', 'from-[#06b6d4] to-[#06124f]', '[\"Short & Long-term Rentals\",\"Workstations & Servers\",\"MacBooks & Windows Laptops\",\"24/7 Replacement Support\"]', '[{\"title\":\"Capital Conservation\",\"description\":\"Shift from CAPEX to OPEX and free up cash flow.\"},{\"title\":\"Flexibility\",\"description\":\"Scale up or down instantly based on project demands.\"},{\"title\":\"Latest Tech\",\"description\":\"Access the newest processors and hardware without buying.\"},{\"title\":\"Zero Maintenance\",\"description\":\"We handle all maintenance and replacements during the rental period.\"}]', '[{\"label\":\"Rental Terms\",\"value\":\"Daily, Weekly, Monthly, Yearly\"},{\"label\":\"Inventory\",\"value\":\"HP, Dell, Lenovo, Apple\"},{\"label\":\"OS Options\",\"value\":\"Windows 10/11 Pro, MacOS, Linux\"},{\"label\":\"Setup\",\"value\":\"Pre-installed Custom Software Images\"}]', '[{\"step\":1,\"title\":\"Requirement\",\"description\":\"Specify configuration, quantity, and duration.\"},{\"step\":2,\"title\":\"Proposal\",\"description\":\"We offer the best commercial quote and terms.\"},{\"step\":3,\"title\":\"Delivery\",\"description\":\"Equipment delivered and set up at your location.\"},{\"step\":4,\"title\":\"Pickup\",\"description\":\"Hassle-free pickup at the end of the rental term.\"}]', '[{\"question\":\"Is there a security deposit?\",\"answer\":\"A refundable security deposit is typically required for new clients, based on the equipment value.\"},{\"question\":\"What happens if a laptop stops working?\",\"answer\":\"We provide an immediate free replacement to ensure zero productive hours are lost.\"},{\"question\":\"Can I extend my rental period?\",\"answer\":\"Yes! You can extend your rental at any time. Just contact us 48 hours before the end date.\"}]', '[{\"name\":\"HP\",\"logo\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/320px-HP_logo_2012.svg.png\"},{\"name\":\"Dell\",\"logo\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Dell_Logo.svg/320px-Dell_Logo.svg.png\"},{\"name\":\"Lenovo\",\"logo\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lenovo_logo_2015.svg/320px-Lenovo_logo_2015.svg.png\"},{\"name\":\"Apple\",\"logo\":\"https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/160px-Apple_logo_black.svg.png\"}]', '[{\"name\":\"Dell Latitude 5430 Laptop\",\"description\":\"14-inch business laptop with Intel i5, 16GB RAM, 512GB SSD. Perfect for office work and remote teams.\",\"image\":\"https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Laptop\"},{\"name\":\"HP EliteDesk 800 Desktop\",\"description\":\"Compact desktop workstation with Intel i7, 32GB RAM, ideal for CAD and design work.\",\"image\":\"https://images.unsplash.com/photo-1587831990711-23ca6441447b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Desktop\"},{\"name\":\"MacBook Pro 14-inch\",\"description\":\"M3 Pro chip, 18GB RAM, 512GB SSD. For creative professionals and developers.\",\"image\":\"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Laptop\"},{\"name\":\"Lenovo ThinkStation P360\",\"description\":\"Professional workstation for engineering, 3D rendering, and data analysis.\",\"image\":\"https://images.unsplash.com/photo-1587831990711-23ca6441447b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80\",\"category\":\"Workstation\"}]', '[{\"industry\":\"IT Services\",\"scenario\":\"Temporary workforce for a 6-month project\",\"solution\":\"Rented 50 laptops with pre-configured VPN and security software\"},{\"industry\":\"Education\",\"scenario\":\"Computer lab setup for training program\",\"solution\":\"Provided 30 desktops on 3-month rental with educational software\"},{\"industry\":\"Events\",\"scenario\":\"Registration kiosks for a 3-day conference\",\"solution\":\"Supplied tablets and laptops with custom event management software\"}]', '2026-01-13 04:54:18', '2026-01-13 04:54:18');

-- --------------------------------------------------------

--
-- Table structure for table `team_members`
--

CREATE TABLE `team_members` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `image` varchar(1024) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `linkedin` varchar(1024) DEFAULT NULL,
  `instagram` varchar(1024) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `team_members`
--

INSERT INTO `team_members` (`id`, `name`, `role`, `image`, `bio`, `linkedin`, `instagram`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'Alex Johnson', 'CEO & Founder', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'Visionary leader with 15+ years in barcode technology.', '#', '#', 0, '2026-01-13 05:01:17', '2026-01-13 05:01:17'),
(3, 'Michael Rodriguez', 'Head of Strategy', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', 'Strategic consultant with expertise in barcode implementation.', '#', '#', 2, '2026-01-13 05:01:17', '2026-01-13 05:01:17');

-- --------------------------------------------------------

--
-- Table structure for table `testimonials`
--

CREATE TABLE `testimonials` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `content` text NOT NULL,
  `rating` int(11) DEFAULT 5,
  `status` enum('Pending','Approved') DEFAULT 'Pending',
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `testimonials`
--

INSERT INTO `testimonials` (`id`, `name`, `email`, `role`, `company`, `content`, `rating`, `status`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'Rajesh Kumar', NULL, 'Operations Manager', 'Reliance Retail', 'VIROS has transformed our inventory management. The barcode scanners are durable and the integration was seamless.', 5, 'Approved', 0, '2026-01-13 04:55:03', '2026-01-13 04:55:03'),
(7, 'Abhishek Kumar Ranjan', 'abhishekkumarranjan965@gmail.com', 'Sr. Network Support Enginner', 'Abc Electrical & Hardware', 'VIROS has transformed our inventory management. The barcode scanners are durable and the integration was seamless.', 3, 'Approved', 0, '2026-01-16 08:01:03', '2026-01-16 08:02:49');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `created_at`) VALUES
(1, 'sales@virosentrepreneurs.com', '$2a$10$ncWnT.iCLOPD68CC2u/GcO/ppwtFzcro1LkuRUkd4qzGEGaY50flS', '2026-01-13 04:53:19');

-- --------------------------------------------------------

--
-- Table structure for table `warranties`
--

CREATE TABLE `warranties` (
  `id` int(11) NOT NULL,
  `serial_number` varchar(100) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `status` enum('active','expired') NOT NULL DEFAULT 'active',
  `warranty_type` varchar(100) NOT NULL,
  `purchase_date` date DEFAULT NULL,
  `expiry_date` date NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `warranties`
--

INSERT INTO `warranties` (`id`, `serial_number`, `product_name`, `status`, `warranty_type`, `purchase_date`, `expiry_date`, `customer_name`, `customer_email`, `customer_phone`, `is_active`, `created_at`, `updated_at`) VALUES
(85, 'SN-EXAMPLE-006', 'Air Conditioner 1.5T', 'active', 'Extended Warranty', '2024-05-12', '2029-05-12', NULL, NULL, NULL, 1, '2026-01-16 06:54:28', '2026-01-16 06:54:28'),
(86, 'SN-EXAMPLE-007', 'Water Purifier', 'active', 'Standard Warranty', '2024-08-18', '2026-08-18', NULL, NULL, NULL, 1, '2026-01-16 06:54:28', '2026-01-16 06:54:28'),
(87, 'SN-EXAMPLE-008', 'Bluetooth Speaker', 'expired', 'Standard Warranty', '2024-09-22', '2025-09-22', NULL, NULL, NULL, 1, '2026-01-16 06:54:28', '2026-01-16 06:54:28'),
(88, 'SN-EXAMPLE-009', 'DSLR Camera', 'active', 'Extended Warranty', '2024-11-30', '2028-11-30', NULL, NULL, NULL, 1, '2026-01-16 06:54:28', '2026-01-16 06:54:28'),
(89, 'SN-EXAMPLE-010', 'Gaming Console', 'active', 'Standard Warranty', '2025-02-14', '2027-02-14', NULL, NULL, NULL, 1, '2026-01-16 06:54:28', '2026-01-16 06:54:28');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `about_core_values`
--
ALTER TABLE `about_core_values`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `about_features`
--
ALTER TABLE `about_features`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `about_milestones`
--
ALTER TABLE `about_milestones`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `about_page_content`
--
ALTER TABLE `about_page_content`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `about_stats`
--
ALTER TABLE `about_stats`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contact_departments`
--
ALTER TABLE `contact_departments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contact_page_content`
--
ALTER TABLE `contact_page_content`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `footer_content`
--
ALTER TABLE `footer_content`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hero_slides`
--
ALTER TABLE `hero_slides`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `legal_content`
--
ALTER TABLE `legal_content`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `navbar_content`
--
ALTER TABLE `navbar_content`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `partners`
--
ALTER TABLE `partners`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`) USING HASH;

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`) USING HASH;

--
-- Indexes for table `team_members`
--
ALTER TABLE `team_members`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `testimonials`
--
ALTER TABLE `testimonials`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`) USING HASH;

--
-- Indexes for table `warranties`
--
ALTER TABLE `warranties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `serial_number` (`serial_number`),
  ADD KEY `idx_serial` (`serial_number`),
  ADD KEY `idx_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `about_core_values`
--
ALTER TABLE `about_core_values`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `about_features`
--
ALTER TABLE `about_features`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `about_milestones`
--
ALTER TABLE `about_milestones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `about_page_content`
--
ALTER TABLE `about_page_content`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `about_stats`
--
ALTER TABLE `about_stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `contact_departments`
--
ALTER TABLE `contact_departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `footer_content`
--
ALTER TABLE `footer_content`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `hero_slides`
--
ALTER TABLE `hero_slides`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `legal_content`
--
ALTER TABLE `legal_content`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `navbar_content`
--
ALTER TABLE `navbar_content`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `partners`
--
ALTER TABLE `partners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `team_members`
--
ALTER TABLE `team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `testimonials`
--
ALTER TABLE `testimonials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `warranties`
--
ALTER TABLE `warranties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
