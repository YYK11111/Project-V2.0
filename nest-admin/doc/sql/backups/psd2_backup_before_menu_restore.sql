-- MySQL dump 10.13  Distrib 9.6.0, for macos26.3 (arm64)
--
-- Host: localhost    Database: psd2
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '13712144-3886-11f1-98ea-74c7874defc5:1-257';

--
-- Table structure for table `ai`
--

DROP TABLE IF EXISTS `ai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `user_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sessionId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '会话id',
  `question` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '问题标题',
  `answer` varchar(10000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '回答内容',
  `is_collect` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '是否收藏: 1是，0否，默认0',
  `is_session` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '是否会话: 1是，0否，默认0',
  `userId` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_c5d55852810417bb80c1d2e6b6a` (`userId`),
  CONSTRAINT `FK_c5d55852810417bb80c1d2e6b6a` FOREIGN KEY (`userId`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai`
--

LOCK TABLES `ai` WRITE;
/*!40000 ALTER TABLE `ai` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `busi_article`
--

DROP TABLE IF EXISTS `busi_article`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `busi_article` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `desc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `catalog_id` bigint DEFAULT NULL COMMENT '目录id',
  `thumb` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '排序',
  `status` enum('0','1','2','3') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2' COMMENT '文章状态，默认已发布',
  `publish_time` datetime DEFAULT NULL COMMENT '定时发布时间',
  PRIMARY KEY (`id`),
  KEY `FK_779981e648bdd5f860a77d89f70` (`catalog_id`),
  CONSTRAINT `FK_779981e648bdd5f860a77d89f70` FOREIGN KEY (`catalog_id`) REFERENCES `busi_article_catalog` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `busi_article`
--

LOCK TABLES `busi_article` WRITE;
/*!40000 ALTER TABLE `busi_article` DISABLE KEYS */;
/*!40000 ALTER TABLE `busi_article` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `busi_article_catalog`
--

DROP TABLE IF EXISTS `busi_article_catalog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `busi_article_catalog` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` bigint DEFAULT NULL COMMENT '父级id',
  PRIMARY KEY (`id`),
  KEY `FK_0dfc936d2a2d433f628e1867200` (`parent_id`),
  CONSTRAINT `FK_0dfc936d2a2d433f628e1867200` FOREIGN KEY (`parent_id`) REFERENCES `busi_article_catalog` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `busi_article_catalog`
--

LOCK TABLES `busi_article_catalog` WRITE;
/*!40000 ALTER TABLE `busi_article_catalog` DISABLE KEYS */;
/*!40000 ALTER TABLE `busi_article_catalog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `busi_article_catalog_closure`
--

DROP TABLE IF EXISTS `busi_article_catalog_closure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `busi_article_catalog_closure` (
  `id_ancestor` bigint NOT NULL,
  `id_descendant` bigint NOT NULL,
  PRIMARY KEY (`id_ancestor`,`id_descendant`),
  KEY `IDX_b54dc4901c089fb17feae9b182` (`id_ancestor`),
  KEY `IDX_f464e150a4bf852a4a7973233f` (`id_descendant`),
  CONSTRAINT `FK_b54dc4901c089fb17feae9b1828` FOREIGN KEY (`id_ancestor`) REFERENCES `busi_article_catalog` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_f464e150a4bf852a4a7973233f4` FOREIGN KEY (`id_descendant`) REFERENCES `busi_article_catalog` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `busi_article_catalog_closure`
--

LOCK TABLES `busi_article_catalog_closure` WRITE;
/*!40000 ALTER TABLE `busi_article_catalog_closure` DISABLE KEYS */;
/*!40000 ALTER TABLE `busi_article_catalog_closure` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `change`
--

DROP TABLE IF EXISTS `change`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `change` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '6' COMMENT '变更类型',
  `impact` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2' COMMENT '影响程度',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '变更状态',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '变更描述',
  `reason` text COLLATE utf8mb4_unicode_ci COMMENT '变更原因',
  `impactAnalysis` text COLLATE utf8mb4_unicode_ci COMMENT '变更影响分析',
  `attachments` json DEFAULT NULL COMMENT '相关附件',
  `cost_impact` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '成本影响',
  `schedule_impact` int NOT NULL DEFAULT '0' COMMENT '进度影响（天）',
  `requester_id` bigint DEFAULT NULL COMMENT '申请人ID',
  `approver_id` bigint DEFAULT NULL COMMENT '审批人ID',
  `approvalComment` text COLLATE utf8mb4_unicode_ci COMMENT '审批意见',
  `approval_date` datetime DEFAULT NULL COMMENT '审批日期',
  `sort` int NOT NULL DEFAULT '0' COMMENT '排序',
  `workflowInstanceId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '工作流实例ID',
  `approvalStatus` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '审批状态: 0无需审批 1审批中 2已通过 3已拒绝',
  `currentNodeName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '当前审批节点名称',
  PRIMARY KEY (`id`),
  KEY `FK_8052dd0f1215c8376f34922610a` (`project_id`),
  KEY `FK_9327c18120533f5b7b0d346f819` (`requester_id`),
  KEY `FK_fa0b42f5c3f52815d0b8c93ddd0` (`approver_id`),
  CONSTRAINT `FK_8052dd0f1215c8376f34922610a` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `FK_9327c18120533f5b7b0d346f819` FOREIGN KEY (`requester_id`) REFERENCES `sys_user` (`id`),
  CONSTRAINT `FK_fa0b42f5c3f52815d0b8c93ddd0` FOREIGN KEY (`approver_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `change`
--

LOCK TABLES `change` WRITE;
/*!40000 ALTER TABLE `change` DISABLE KEYS */;
/*!40000 ALTER TABLE `change` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crm_contract`
--

DROP TABLE IF EXISTS `crm_contract`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_contract` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '合同名称',
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '合同编号',
  `customerId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '客户ID',
  `opportunityId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关联机会ID',
  `projectId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关联项目ID',
  `amount` decimal(14,2) DEFAULT NULL COMMENT '合同金额(元)',
  `receivedAmount` decimal(14,2) DEFAULT NULL COMMENT '已收款金额(元)',
  `signingDate` datetime DEFAULT NULL COMMENT '签订时间',
  `startDate` datetime DEFAULT NULL COMMENT '开始时间',
  `endDate` datetime DEFAULT NULL COMMENT '结束时间',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '合同状态:1执行中 2已到期 3已终止 4已归档',
  `ownerId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '合同负责人ID',
  `contractFile` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '合同文件路径',
  `remark` text COLLATE utf8mb4_unicode_ci COMMENT '备注',
  `customer_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_3f20acac3d49d72d8175de15567` (`customer_id`),
  CONSTRAINT `FK_3f20acac3d49d72d8175de15567` FOREIGN KEY (`customer_id`) REFERENCES `crm_customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crm_contract`
--

LOCK TABLES `crm_contract` WRITE;
/*!40000 ALTER TABLE `crm_contract` DISABLE KEYS */;
/*!40000 ALTER TABLE `crm_contract` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crm_customer`
--

DROP TABLE IF EXISTS `crm_customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_customer` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '客户名称',
  `shortName` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '客户简称',
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '客户编号',
  `type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '客户类型:1企业客户 2个人客户',
  `unifiedSocialCreditCode` varchar(18) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '统一社会信用代码',
  `industry` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '所属行业',
  `scale` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '企业规模',
  `address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '企业地址',
  `contactPerson` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系人',
  `contactPhone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系电话',
  `contactEmail` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系邮箱',
  `level` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2' COMMENT '客户等级:1 VIP 2重要 3普通',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '客户状态:1潜在 2意向 3成交 4流失',
  `salesId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '销售负责人ID',
  `deptId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '所属部门ID',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '客户描述',
  `extraInfo` json DEFAULT NULL COMMENT '扩展信息',
  `customerValue` decimal(14,2) DEFAULT NULL COMMENT '客户价值(万元)',
  `workflowInstanceId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '工作流实例ID',
  `approvalStatus` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '审批状态: 0无需审批 1审批中 2已通过 3已拒绝',
  `currentNodeName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '当前审批节点名称',
  `sales_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_c28897c5757ba61ddb11cdd7aad` (`sales_id`),
  CONSTRAINT `FK_c28897c5757ba61ddb11cdd7aad` FOREIGN KEY (`sales_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crm_customer`
--

LOCK TABLES `crm_customer` WRITE;
/*!40000 ALTER TABLE `crm_customer` DISABLE KEYS */;
/*!40000 ALTER TABLE `crm_customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crm_interaction`
--

DROP TABLE IF EXISTS `crm_interaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_interaction` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `customerId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '客户ID',
  `interactionType` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '互动类型:1电话 2邮件 3拜访 4会议 5其他',
  `content` text COLLATE utf8mb4_unicode_ci COMMENT '互动内容',
  `interactionTime` datetime DEFAULT NULL COMMENT '互动时间',
  `operatorId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '互动人ID',
  `operatorName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '互动人名称',
  `nextFollowTime` datetime DEFAULT NULL COMMENT '下次跟进时间',
  `attachments` json DEFAULT NULL COMMENT '附件列表',
  `customer_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_10bd7191ca5e727984dbe4c40be` (`customer_id`),
  CONSTRAINT `FK_10bd7191ca5e727984dbe4c40be` FOREIGN KEY (`customer_id`) REFERENCES `crm_customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crm_interaction`
--

LOCK TABLES `crm_interaction` WRITE;
/*!40000 ALTER TABLE `crm_interaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `crm_interaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crm_opportunity`
--

DROP TABLE IF EXISTS `crm_opportunity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_opportunity` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '机会名称',
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '机会编号',
  `customerId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '客户ID',
  `expectedAmount` decimal(14,2) DEFAULT NULL COMMENT '预期金额(元)',
  `stage` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '销售阶段:1初步接触 2需求分析 3方案制定 4商务谈判 5合同签订',
  `successRate` int NOT NULL DEFAULT '0' COMMENT '成功概率(%)',
  `expectedCloseDate` datetime DEFAULT NULL COMMENT '预计成交时间',
  `actualCloseDate` datetime DEFAULT NULL COMMENT '实际成交时间',
  `salesId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '销售负责人ID',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '机会描述',
  `lossReason` text COLLATE utf8mb4_unicode_ci COMMENT '失败原因',
  `projectId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关联项目ID',
  `customer_id` bigint DEFAULT NULL,
  `sales_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_1ce64cf5227d42bc6aaf2ac924d` (`customer_id`),
  KEY `FK_7996fbcdc751385efa6407367bd` (`sales_id`),
  CONSTRAINT `FK_1ce64cf5227d42bc6aaf2ac924d` FOREIGN KEY (`customer_id`) REFERENCES `crm_customer` (`id`),
  CONSTRAINT `FK_7996fbcdc751385efa6407367bd` FOREIGN KEY (`sales_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crm_opportunity`
--

LOCK TABLES `crm_opportunity` WRITE;
/*!40000 ALTER TABLE `crm_opportunity` DISABLE KEYS */;
/*!40000 ALTER TABLE `crm_opportunity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document`
--

DROP TABLE IF EXISTS `document`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '文档类型',
  `content` text COLLATE utf8mb4_unicode_ci COMMENT '富文本内容',
  `file_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '文件路径',
  `file_size` int DEFAULT NULL COMMENT '文件大小（KB）',
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `uploader_id` bigint DEFAULT NULL COMMENT '上传人ID',
  PRIMARY KEY (`id`),
  KEY `FK_4d4739c863ab05b56a8eabd15ea` (`project_id`),
  KEY `FK_0020f71be3279ae1cc68c9957ad` (`uploader_id`),
  CONSTRAINT `FK_0020f71be3279ae1cc68c9957ad` FOREIGN KEY (`uploader_id`) REFERENCES `sys_user` (`id`),
  CONSTRAINT `FK_4d4739c863ab05b56a8eabd15ea` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document`
--

LOCK TABLES `document` WRITE;
/*!40000 ALTER TABLE `document` DISABLE KEYS */;
/*!40000 ALTER TABLE `document` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `milestone`
--

DROP TABLE IF EXISTS `milestone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `milestone` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '里程碑描述',
  `due_date` datetime DEFAULT NULL COMMENT '计划完成日期',
  `completed_date` datetime DEFAULT NULL COMMENT '实际完成日期',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '状态',
  `taskCount` int NOT NULL DEFAULT '0' COMMENT '关联任务数',
  `completedTaskCount` int NOT NULL DEFAULT '0' COMMENT '已完成任务数',
  `creator_id` bigint DEFAULT NULL COMMENT '创建人ID',
  `deliverables` json DEFAULT NULL COMMENT '交付物清单',
  `sort` int NOT NULL DEFAULT '0' COMMENT '排序',
  PRIMARY KEY (`id`),
  KEY `FK_a6f99388cc316eeee256347f0c0` (`project_id`),
  KEY `FK_8f1eb19a1cbdd4b3873c5ff0a1a` (`creator_id`),
  CONSTRAINT `FK_8f1eb19a1cbdd4b3873c5ff0a1a` FOREIGN KEY (`creator_id`) REFERENCES `sys_user` (`id`),
  CONSTRAINT `FK_a6f99388cc316eeee256347f0c0` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `milestone`
--

LOCK TABLES `milestone` WRITE;
/*!40000 ALTER TABLE `milestone` DISABLE KEYS */;
/*!40000 ALTER TABLE `milestone` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project`
--

DROP TABLE IF EXISTS `project`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '项目编号',
  `leader_id` bigint DEFAULT NULL COMMENT '项目负责人ID',
  `start_date` datetime DEFAULT NULL COMMENT '开始时间',
  `end_date` datetime DEFAULT NULL COMMENT '结束时间',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '项目状态',
  `project_type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '项目类型',
  `priority` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2' COMMENT '优先级',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '项目描述',
  `attachments` json DEFAULT NULL COMMENT '项目附件',
  `is_archived` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '是否归档',
  `budget` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '项目预算（元）',
  `actualCost` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '实际成本（元）',
  `customerId` int DEFAULT NULL COMMENT '关联客户ID',
  `progress` int NOT NULL DEFAULT '0' COMMENT '整体进度百分比（0-100）',
  `workflowInstanceId` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '工作流实例ID',
  `approvalStatus` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '审批状态: 0无需审批 1审批中 2已通过 3已拒绝',
  `currentNodeName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '当前审批节点名称',
  `customer_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_e6a130ca187ac0e495333cf4d47` (`leader_id`),
  KEY `FK_9822110bfde667efe4165da219e` (`customer_id`),
  CONSTRAINT `FK_9822110bfde667efe4165da219e` FOREIGN KEY (`customer_id`) REFERENCES `crm_customer` (`id`),
  CONSTRAINT `FK_e6a130ca187ac0e495333cf4d47` FOREIGN KEY (`leader_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project`
--

LOCK TABLES `project` WRITE;
/*!40000 ALTER TABLE `project` DISABLE KEYS */;
/*!40000 ALTER TABLE `project` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_member`
--

DROP TABLE IF EXISTS `project_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_member` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `project_id` bigint DEFAULT NULL COMMENT '项目ID',
  `user_id` bigint DEFAULT NULL COMMENT '用户ID',
  `role` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'F' COMMENT '成员角色',
  `is_active` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '是否激活',
  `is_core` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '是否核心成员',
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '成员备注',
  `sort` int NOT NULL DEFAULT '0' COMMENT '排序',
  PRIMARY KEY (`id`),
  KEY `FK_aaef76230abfcdf30adb15d0be8` (`project_id`),
  KEY `FK_c5aa3e0aec43d3459e159d21dd3` (`user_id`),
  CONSTRAINT `FK_aaef76230abfcdf30adb15d0be8` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `FK_c5aa3e0aec43d3459e159d21dd3` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_member`
--

LOCK TABLES `project_member` WRITE;
/*!40000 ALTER TABLE `project_member` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `risk`
--

DROP TABLE IF EXISTS `risk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `risk` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `category` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '8' COMMENT '风险分类',
  `level` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2' COMMENT '风险等级',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '风险状态',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '风险描述',
  `mitigation` text COLLATE utf8mb4_unicode_ci COMMENT '风险应对措施',
  `impact_estimate` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT '影响程度(%)',
  `risk_owner_id` bigint DEFAULT NULL COMMENT '责任人ID',
  `identified_date` datetime DEFAULT NULL COMMENT '识别日期',
  `due_date` datetime DEFAULT NULL COMMENT '计划解决日期',
  `resolved_date` datetime DEFAULT NULL COMMENT '实际解决日期',
  `sort` int NOT NULL DEFAULT '0' COMMENT '排序',
  PRIMARY KEY (`id`),
  KEY `FK_e77017cf3425868ca503f2f001a` (`project_id`),
  KEY `FK_338fa242554c9a309fcafd1b477` (`risk_owner_id`),
  CONSTRAINT `FK_338fa242554c9a309fcafd1b477` FOREIGN KEY (`risk_owner_id`) REFERENCES `sys_user` (`id`),
  CONSTRAINT `FK_e77017cf3425868ca503f2f001a` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `risk`
--

LOCK TABLES `risk` WRITE;
/*!40000 ALTER TABLE `risk` DISABLE KEYS */;
/*!40000 ALTER TABLE `risk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sprint`
--

DROP TABLE IF EXISTS `sprint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sprint` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT 'Sprint状态',
  `goal` text COLLATE utf8mb4_unicode_ci COMMENT 'Sprint目标',
  `start_date` datetime DEFAULT NULL COMMENT '开始日期',
  `end_date` datetime DEFAULT NULL COMMENT '结束日期',
  `capacity` int NOT NULL DEFAULT '0' COMMENT '团队容量（故事点或工时）',
  `committedPoints` int NOT NULL DEFAULT '0' COMMENT '承诺的故事点',
  `completedPoints` int NOT NULL DEFAULT '0' COMMENT '已完成的故事点',
  `totalStoryPoints` int NOT NULL DEFAULT '0' COMMENT '总故事点',
  `totalCompletedStoryPoints` int NOT NULL DEFAULT '0' COMMENT '已完成故事点',
  `totalTaskCount` int NOT NULL DEFAULT '0' COMMENT '总任务数',
  `completedTaskCount` int NOT NULL DEFAULT '0' COMMENT '已完成任务数',
  `sort` int NOT NULL DEFAULT '0' COMMENT '排序',
  `scrum_master_id` bigint DEFAULT NULL COMMENT 'Scrum Master ID',
  `retrospective` text COLLATE utf8mb4_unicode_ci COMMENT '回顾总结',
  PRIMARY KEY (`id`),
  KEY `FK_ce4f0a9ae20ecf7b679990b7606` (`project_id`),
  KEY `FK_e99dd38f4b167c31704f9f1f73a` (`scrum_master_id`),
  CONSTRAINT `FK_ce4f0a9ae20ecf7b679990b7606` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `FK_e99dd38f4b167c31704f9f1f73a` FOREIGN KEY (`scrum_master_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sprint`
--

LOCK TABLES `sprint` WRITE;
/*!40000 ALTER TABLE `sprint` DISABLE KEYS */;
/*!40000 ALTER TABLE `sprint` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_config`
--

DROP TABLE IF EXISTS `sys_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_config` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `system_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `system_logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_config`
--

LOCK TABLES `sys_config` WRITE;
/*!40000 ALTER TABLE `sys_config` DISABLE KEYS */;
INSERT INTO `sys_config` VALUES (1,'2026-04-15 13:50:15','NestAdmin','2026-04-15 13:50:23','NestAdmin',NULL,'YYK','default/2026-04-15/1776232213477-628089096.jpeg');
/*!40000 ALTER TABLE `sys_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_dept`
--

DROP TABLE IF EXISTS `sys_dept`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_dept` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '部门名称',
  `parent_id` bigint DEFAULT NULL COMMENT '父级id',
  `leader_id` bigint DEFAULT NULL COMMENT '部门负责人ID',
  PRIMARY KEY (`id`),
  KEY `FK_92dad1cb42d3b62bc9f2e8e58ba` (`parent_id`),
  KEY `FK_2a89c24a402c1245dd6915c68b6` (`leader_id`),
  CONSTRAINT `FK_2a89c24a402c1245dd6915c68b6` FOREIGN KEY (`leader_id`) REFERENCES `sys_user` (`id`),
  CONSTRAINT `FK_92dad1cb42d3b62bc9f2e8e58ba` FOREIGN KEY (`parent_id`) REFERENCES `sys_dept` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_dept`
--

LOCK TABLES `sys_dept` WRITE;
/*!40000 ALTER TABLE `sys_dept` DISABLE KEYS */;
/*!40000 ALTER TABLE `sys_dept` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_dept_closure`
--

DROP TABLE IF EXISTS `sys_dept_closure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_dept_closure` (
  `id_ancestor` bigint NOT NULL,
  `id_descendant` bigint NOT NULL,
  PRIMARY KEY (`id_ancestor`,`id_descendant`),
  KEY `IDX_cfc440ee3ad8e00d7706a5769b` (`id_ancestor`),
  KEY `IDX_aec3172874d6b45638d3c50566` (`id_descendant`),
  CONSTRAINT `FK_aec3172874d6b45638d3c505667` FOREIGN KEY (`id_descendant`) REFERENCES `sys_dept` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_cfc440ee3ad8e00d7706a5769b1` FOREIGN KEY (`id_ancestor`) REFERENCES `sys_dept` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_dept_closure`
--

LOCK TABLES `sys_dept_closure` WRITE;
/*!40000 ALTER TABLE `sys_dept_closure` DISABLE KEYS */;
/*!40000 ALTER TABLE `sys_dept_closure` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_file`
--

DROP TABLE IF EXISTS `sys_file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_file` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '原始文件名',
  `stored_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '存储文件名',
  `stored_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '存储路径',
  `file_size` bigint DEFAULT NULL COMMENT '文件大小(字节)',
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'MIME类型',
  `business_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '业务类型',
  `business_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关联业务ID',
  `uploader_id` bigint DEFAULT NULL COMMENT '上传人ID',
  `upload_time` datetime DEFAULT NULL COMMENT '上传时间',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待关联, 1-已关联, 2-已删除',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `IDX_06f4140cd396fb9977f09e9002` (`status`),
  KEY `IDX_1b5494e6d21b64cf4421587373` (`business_type`,`business_id`),
  KEY `FK_e0c62012eaed88cb1a509f53764` (`uploader_id`),
  CONSTRAINT `FK_e0c62012eaed88cb1a509f53764` FOREIGN KEY (`uploader_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_file`
--

LOCK TABLES `sys_file` WRITE;
/*!40000 ALTER TABLE `sys_file` DISABLE KEYS */;
INSERT INTO `sys_file` VALUES (1,'2026-04-15 13:50:13',NULL,NULL,NULL,NULL,'u=244243273,2720142885&fm=253&app=138&f=JPEG.jpeg','default/2026-04-15/1776232213477-628089096.jpeg','default/2026-04-15/1776232213477-628089096.jpeg',111218,'image/jpeg',NULL,NULL,NULL,'2026-04-15 13:50:13',0,NULL);
/*!40000 ALTER TABLE `sys_file` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_login_log`
--

DROP TABLE IF EXISTS `sys_login_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_login_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `session` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '会话编号',
  `account` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '登录账号',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '登录密码',
  `ip` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ip地址',
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '登录地点',
  `browser` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '浏览器类型',
  `os` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作系统',
  `is_success` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '是否登录成功: 1是，0否，默认1',
  `msg` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '登录成功' COMMENT '提示消息',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_login_log`
--

LOCK TABLES `sys_login_log` WRITE;
/*!40000 ALTER TABLE `sys_login_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `sys_login_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_menu`
--

DROP TABLE IF EXISTS `sys_menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_menu` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `desc` varchar(100) DEFAULT NULL COMMENT '菜单描述',
  `parent_id` bigint DEFAULT NULL COMMENT '父级id',
  `order` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '1' COMMENT '排序',
  `path` varchar(100) DEFAULT NULL COMMENT '路由地址',
  `component` varchar(100) DEFAULT NULL COMMENT '组件路径',
  `type` enum('catalog','menu','button') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'catalog' COMMENT '菜单类型，默认catalog',
  `icon` varchar(100) DEFAULT NULL COMMENT '菜单图标',
  `is_hidden` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '0' COMMENT '是否隐藏: 1是，0否，默认0',
  `is_active` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '1' COMMENT '是否激活: 1是，0否，默认1',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `create_user` varchar(255) DEFAULT NULL COMMENT '创建人',
  `update_user` varchar(255) DEFAULT NULL COMMENT '更新人',
  `name` varchar(255) DEFAULT NULL COMMENT '菜单名称',
  `permissionKey` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FK_7cef4adcf9b01b2c6f14d52b0f3` (`parent_id`) USING BTREE,
  CONSTRAINT `FK_7cef4adcf9b01b2c6f14d52b0f3` FOREIGN KEY (`parent_id`) REFERENCES `sys_menu` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_menu`
--

LOCK TABLES `sys_menu` WRITE;
/*!40000 ALTER TABLE `sys_menu` DISABLE KEYS */;
INSERT INTO `sys_menu` VALUES (5,'2024-08-06 22:03:07','2024-10-27 17:43:22','',NULL,'1','system','','catalog','system','0','1',NULL,'','admin','系统管理',NULL),(6,'2024-08-06 22:20:45','2024-10-27 17:40:42','用户管理',5,'1','users','system/users/index','menu','user','0','1',NULL,'','admin','用户管理',NULL),(7,'2024-08-06 22:22:56','2024-10-27 17:43:12','',5,'2','roles','system/roles/index','menu','peoples','0','1',NULL,'','admin','角色管理',NULL),(8,'2024-08-06 22:30:06','2024-10-27 17:44:03','',5,'3','menus','system/menus/index','menu','tree-table','0','1',NULL,'','admin','菜单管理',NULL),(9,'2024-08-15 00:04:06','2024-10-27 17:50:00','',NULL,'2','content','','catalog','dict','0','1',NULL,'','admin','内容管理',NULL),(10,'2024-08-15 00:06:53','2024-10-27 17:45:47','通知管理',5,'4','notices','system/notices/index','menu','message','0','1',NULL,'','admin','通知管理',NULL),(11,'2024-08-15 00:10:33','2024-10-27 17:47:14','系统监控',NULL,'2','systemMonitor','','catalog','monitor','0','1',NULL,'','admin','系统监控',NULL),(12,'2024-08-15 00:22:13','2024-10-27 17:48:21','登录日志',11,'1','loginLog','systemMonitor/loginLog/index','menu','log','0','1',NULL,'','admin','登录日志',NULL),(13,'2024-08-15 00:22:59','2024-10-02 15:34:33','操作日志',11,'2','operateLog','','catalog','','0','1','1','','','操作日志',NULL),(14,'2024-08-15 00:23:45','2024-10-27 17:47:53','',11,'1','onlineUser','systemMonitor/onlineUser/index','menu','online','0','1',NULL,'','admin','在线用户',NULL),(15,'2024-08-15 00:27:21','2024-10-27 17:49:41','服务监控',11,'2','osInfo','systemMonitor/osInfo/index','menu','druid','0','1',NULL,'','admin','服务监控',NULL),(16,'2024-08-15 00:33:54','2024-10-27 17:50:07','文章管理',9,'1','articleManage','','catalog','clipboard','0','1',NULL,'','admin','文章管理',NULL),(17,'2024-08-15 00:36:52','2024-10-27 17:46:28','配置管理',5,'5','configs','system/configs/index','menu','swagger','0','1',NULL,'','admin','配置管理',NULL),(18,'2024-08-15 00:41:15','2024-10-02 15:34:35','首页',NULL,'1','index','','catalog','dashboard','0','1',NULL,'','','首页',NULL),(19,'2024-08-15 00:44:53','2024-10-27 17:50:34','首页',18,'1','index','index/index','menu','dashboard','1','1',NULL,'','admin','首页',NULL),(20,'2024-08-15 01:12:57','2024-10-02 15:34:36','应用工具',NULL,'6','appTools','','catalog','','0','0',NULL,'','admin','应用工具',NULL),(21,'2024-08-15 01:14:35','2024-10-02 15:34:36','',20,'1','poster','appTools/poster/index','menu','','0','1',NULL,'','','宣传海报',NULL),(22,'2024-08-15 01:15:47','2024-10-02 15:34:36','',20,'1','forms','appTools/forms/index','menu','','0','1',NULL,'','','访问表单',NULL),(23,'2024-10-19 00:24:43','2024-10-19 00:25:25',NULL,16,'1','index','content/articleManage/index','menu',NULL,'1','1',NULL,'admin','admin','文章列表',NULL),(24,'2024-10-19 00:26:05',NULL,NULL,16,'2','aev','content/articleManage/aev','menu',NULL,'1','1',NULL,'admin',NULL,'{新增}',NULL),(25,'2026-04-15 13:52:52','2026-04-15 13:52:52','工作流管理',NULL,'3','workflow','','catalog','workflow','0','1',NULL,'admin','admin','工作流管理',NULL),(26,'2026-04-15 13:52:52','2026-04-15 13:52:52','流程定义管理',25,'1','index','business/workflow/index','menu','setting','0','1',NULL,'admin','admin','流程管理',NULL),(27,'2026-04-15 13:52:52','2026-04-15 13:52:52','流程设计器',25,'2','designer','business/workflow/designer','menu','edit','1','1',NULL,'admin','admin','流程设计器',NULL),(28,'2026-04-15 13:52:52','2026-04-15 13:52:52','自动触发配置',25,'3','businessConfig','business/workflow/businessConfig','menu','config','0','1',NULL,'admin','admin','自动触发配置',NULL),(29,'2026-04-15 13:52:52','2026-04-15 13:52:52','我的待办审批',25,'4','tasks','business/workflow/tasks','menu','todo','0','1',NULL,'admin','admin','我的待办',NULL),(30,'2026-04-15 13:52:52','2026-04-15 13:52:52','流程实例列表',25,'5','instances','business/workflow/instances','menu','list','0','1',NULL,'admin','admin','流程实例',NULL),(31,'2026-04-15 13:52:52',NULL,NULL,NULL,'4','projectManage','business/projectManage/index','catalog','project','0','1',NULL,'system','system','项目管理','business:project'),(32,'2026-04-15 13:52:52',NULL,NULL,NULL,'5','taskManage','business/taskManage/index','catalog','task','0','1',NULL,'system','system','任务管理','business:task'),(33,'2026-04-15 13:52:52',NULL,NULL,NULL,'6','ticketManage','business/ticketManage/index','catalog','ticket','0','1',NULL,'system','system','工单管理','business:ticket'),(34,'2026-04-15 13:52:52',NULL,NULL,NULL,'7','documentManage','business/documentManage/index','catalog','document','0','1',NULL,'system','system','文档管理','business:document'),(35,'2026-04-15 14:11:08',NULL,NULL,NULL,'8','sprintManage','business/sprintManage/index','catalog','calendar','0','1',NULL,'system','system','Sprint管理','business:sprint'),(36,'2026-04-15 14:11:08',NULL,NULL,NULL,'9','milestoneManage','business/milestoneManage/index','catalog','flag','0','1',NULL,'system','system','里程碑管理','business:milestone'),(37,'2026-04-15 14:11:08',NULL,NULL,NULL,'10','riskManage','business/riskManage/index','catalog','warning','0','1',NULL,'system','system','风险管理','business:risk'),(38,'2026-04-15 14:11:08',NULL,NULL,NULL,'11','changeManage','business/changeManage/index','catalog','refresh','0','1',NULL,'system','system','变更管理','business:change'),(39,'2026-04-15 14:11:08',NULL,NULL,NULL,'12','projectMemberManage','business/projectMemberManage/index','catalog','peoples','0','1',NULL,'system','system','项目成员','business:projectMember'),(40,'2026-04-15 14:11:08',NULL,NULL,NULL,'13','taskCommentManage','business/taskCommentManage/index','catalog','message','0','1',NULL,'system','system','任务评论','business:taskComment'),(41,'2026-04-15 14:11:08',NULL,NULL,NULL,'14','userStoryManage','business/userStoryManage/index','catalog','list','0','1',NULL,'system','system','用户故事','business:userStory'),(42,'2026-04-15 14:11:08',NULL,NULL,NULL,'15','crm','','catalog','customer','0','1',NULL,'system','system','CRM客户管理','business:crm'),(43,'2026-04-15 14:11:08',NULL,NULL,42,'1','customerManage','business/crm/customerManage/index','menu','peoples','0','1',NULL,'system','system','客户管理','business:crm:customer'),(44,'2026-04-15 14:11:08',NULL,NULL,42,'2','interactionManage','business/crm/interactionManage/index','menu','phone','0','1',NULL,'system','system','互动记录','business:crm:interaction'),(45,'2026-04-15 14:11:08',NULL,NULL,42,'3','opportunityManage','business/crm/opportunityManage/index','menu','trend-charts','0','1',NULL,'system','system','销售机会','business:crm:opportunity'),(46,'2026-04-15 14:11:08',NULL,NULL,42,'4','contractManage','business/crm/contractManage/index','menu','document','0','1',NULL,'system','system','合同管理','business:crm:contract');
/*!40000 ALTER TABLE `sys_menu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_menu_closure`
--

DROP TABLE IF EXISTS `sys_menu_closure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_menu_closure` (
  `id_ancestor` bigint NOT NULL,
  `id_descendant` bigint NOT NULL,
  PRIMARY KEY (`id_ancestor`,`id_descendant`),
  KEY `IDX_ee0a4003eda64ae8081ebdde04` (`id_ancestor`),
  KEY `IDX_78f742978fc6b23a674732d027` (`id_descendant`),
  CONSTRAINT `FK_78f742978fc6b23a674732d027c` FOREIGN KEY (`id_descendant`) REFERENCES `sys_menu` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ee0a4003eda64ae8081ebdde042` FOREIGN KEY (`id_ancestor`) REFERENCES `sys_menu` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_menu_closure`
--

LOCK TABLES `sys_menu_closure` WRITE;
/*!40000 ALTER TABLE `sys_menu_closure` DISABLE KEYS */;
INSERT INTO `sys_menu_closure` VALUES (5,5),(5,6),(5,7),(5,8),(5,10),(5,17),(6,6),(7,7),(8,8),(9,9),(9,16),(9,23),(9,24),(10,10),(11,11),(11,12),(11,13),(11,14),(11,15),(12,12),(13,13),(14,14),(15,15),(16,16),(16,23),(16,24),(17,17),(18,18),(18,19),(19,19),(20,20),(20,21),(20,22),(21,21),(22,22),(23,23),(24,24);
/*!40000 ALTER TABLE `sys_menu_closure` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_message`
--

DROP TABLE IF EXISTS `sys_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_message` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '消息标题',
  `content` text COLLATE utf8mb4_unicode_ci COMMENT '消息内容',
  `message_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '消息类型',
  `source_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '来源类型',
  `source_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '来源ID',
  `receiver_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '接收人ID',
  `sender_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '发送人ID',
  `is_read` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '是否已读: 1是，0否，默认0',
  `read_time` datetime DEFAULT NULL COMMENT '已读时间',
  `channel` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system' COMMENT '消息通道',
  `link_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'route' COMMENT '跳转类型',
  `link_url` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '跳转地址',
  `link_params` json DEFAULT NULL COMMENT '跳转参数',
  `extra_data` json DEFAULT NULL COMMENT '扩展数据',
  `is_active` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '是否启用: 1是，0否，默认1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_message`
--

LOCK TABLES `sys_message` WRITE;
/*!40000 ALTER TABLE `sys_message` DISABLE KEYS */;
/*!40000 ALTER TABLE `sys_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_notice`
--

DROP TABLE IF EXISTS `sys_notice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_notice` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '公告标题',
  `is_active` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '是否激活: 1是，0否，默认1',
  `content` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '公告内容',
  `remark` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  `receiver_ids` json DEFAULT NULL COMMENT '接收人ID列表JSON',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_notice`
--

LOCK TABLES `sys_notice` WRITE;
/*!40000 ALTER TABLE `sys_notice` DISABLE KEYS */;
/*!40000 ALTER TABLE `sys_notice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_role`
--

DROP TABLE IF EXISTS `sys_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permissionKey` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dataPermissionType` enum('self','dept','deptAndChildren','all') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'self' COMMENT '数据权限类型，默认self',
  `is_active` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '是否激活: 1是，0否，默认1',
  `order` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '排序',
  `remark` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_role`
--

LOCK TABLES `sys_role` WRITE;
/*!40000 ALTER TABLE `sys_role` DISABLE KEYS */;
INSERT INTO `sys_role` VALUES (1,'2026-04-15 13:13:16','system',NULL,NULL,NULL,'超级管理员','admin','self','1','1','系统超级管理员角色'),(2,'2026-04-15 13:13:16','system',NULL,NULL,NULL,'普通用户','user','self','1','2','普通用户角色');
/*!40000 ALTER TABLE `sys_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_role_menu`
--

DROP TABLE IF EXISTS `sys_role_menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_role_menu` (
  `role_id` bigint NOT NULL,
  `menu_id` bigint NOT NULL,
  PRIMARY KEY (`role_id`,`menu_id`),
  KEY `IDX_b65fa84413c357d7282153b4a8` (`role_id`),
  KEY `IDX_543ffcaa38d767909d9022f252` (`menu_id`),
  CONSTRAINT `fk_sys_menu_role` FOREIGN KEY (`menu_id`) REFERENCES `sys_menu` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sys_role_menu` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_role_menu`
--

LOCK TABLES `sys_role_menu` WRITE;
/*!40000 ALTER TABLE `sys_role_menu` DISABLE KEYS */;
INSERT INTO `sys_role_menu` VALUES (1,5),(1,6),(1,7),(1,8),(1,9),(1,10),(1,11),(1,12),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),(1,21),(1,22),(1,23),(1,24),(1,25),(1,26),(1,27),(1,28),(1,29),(1,30),(1,31),(1,32),(1,33),(1,34),(1,35),(1,36),(1,37),(1,38),(1,39),(1,40),(1,41),(1,42),(1,43),(1,44),(1,45),(1,46);
/*!40000 ALTER TABLE `sys_role_menu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_user`
--

DROP TABLE IF EXISTS `sys_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '昵称',
  `themeHsl` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '主题颜色HSL值，格式：h,s,l',
  `password` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 's3wmd2VReF1IjZhK59gLBY0OjYlzjA==' COMMENT '密码',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '头像地址',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('man','woamn') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '性别，默认 null',
  `dept_id` bigint DEFAULT NULL COMMENT '部门id',
  `is_active` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '是否激活: 1是，0否，默认1',
  PRIMARY KEY (`id`),
  KEY `FK_96bde34263e2ae3b46f011124ac` (`dept_id`),
  CONSTRAINT `FK_96bde34263e2ae3b46f011124ac` FOREIGN KEY (`dept_id`) REFERENCES `sys_dept` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_user`
--

LOCK TABLES `sys_user` WRITE;
/*!40000 ALTER TABLE `sys_user` DISABLE KEYS */;
INSERT INTO `sys_user` VALUES (1,'2026-04-15 13:13:16','system',NULL,NULL,NULL,'admin','超级管理员',NULL,'s3wmd2VReF1IjZhK59gLBY0OjYlzjA==',NULL,'admin@nestadmin.com','13800138000',NULL,NULL,'1');
/*!40000 ALTER TABLE `sys_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_user_role`
--

DROP TABLE IF EXISTS `sys_user_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_user_role` (
  `userId` bigint NOT NULL,
  `roleId` bigint NOT NULL,
  PRIMARY KEY (`userId`,`roleId`),
  UNIQUE KEY `IDX_46ab411e2d0e0811af780bbf59` (`userId`,`roleId`),
  KEY `IDX_3c879483a655a9387b8c487608` (`userId`),
  KEY `IDX_3ec9b31612c830bf0221b9e7f3` (`roleId`),
  CONSTRAINT `fk_sys_user_role_role` FOREIGN KEY (`roleId`) REFERENCES `sys_role` (`id`),
  CONSTRAINT `fk_sys_user_role_user` FOREIGN KEY (`userId`) REFERENCES `sys_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_user_role`
--

LOCK TABLES `sys_user_role` WRITE;
/*!40000 ALTER TABLE `sys_user_role` DISABLE KEYS */;
INSERT INTO `sys_user_role` VALUES (1,1);
/*!40000 ALTER TABLE `sys_user_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task`
--

DROP TABLE IF EXISTS `task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `sprint_id` bigint DEFAULT NULL COMMENT '所属Sprint ID',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '任务编号',
  `leader_id` bigint DEFAULT NULL COMMENT '负责人ID',
  `executor_ids` json DEFAULT NULL COMMENT '经办人ID数组',
  `parent_id` bigint DEFAULT NULL COMMENT '父任务ID',
  `start_date` datetime DEFAULT NULL COMMENT '开始时间',
  `end_date` datetime DEFAULT NULL COMMENT '截止时间',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '任务状态',
  `priority` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2' COMMENT '优先级',
  `progress` int NOT NULL DEFAULT '0' COMMENT '进度（0-100）',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '任务描述',
  `attachments` json DEFAULT NULL COMMENT '任务附件',
  `estimatedHours` int DEFAULT NULL COMMENT '预估工时（小时）',
  `actualHours` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '实际工时（小时）',
  `remainingHours` int DEFAULT NULL COMMENT '剩余工时（小时）',
  `acceptanceCriteria` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '验收标准',
  `storyPoints` int DEFAULT NULL COMMENT '故事点',
  `workflowInstanceId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '工作流实例ID',
  `approvalStatus` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '审批状态: 0无需审批 1审批中 2已通过 3已拒绝',
  `currentNodeName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '当前审批节点名称',
  PRIMARY KEY (`id`),
  KEY `FK_1f53e7ffe94530f9e0221224d29` (`project_id`),
  KEY `FK_422c15d3980fd646448d61f61d8` (`sprint_id`),
  KEY `FK_9842b316550eb144b19a766bad9` (`leader_id`),
  KEY `FK_5b12d07794e1d6428696b35fd7e` (`parent_id`),
  CONSTRAINT `FK_1f53e7ffe94530f9e0221224d29` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `FK_422c15d3980fd646448d61f61d8` FOREIGN KEY (`sprint_id`) REFERENCES `sprint` (`id`),
  CONSTRAINT `FK_5b12d07794e1d6428696b35fd7e` FOREIGN KEY (`parent_id`) REFERENCES `task` (`id`),
  CONSTRAINT `FK_9842b316550eb144b19a766bad9` FOREIGN KEY (`leader_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task`
--

LOCK TABLES `task` WRITE;
/*!40000 ALTER TABLE `task` DISABLE KEYS */;
/*!40000 ALTER TABLE `task` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_comment`
--

DROP TABLE IF EXISTS `task_comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_comment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `task_id` bigint DEFAULT NULL COMMENT '任务ID',
  `user_id` bigint DEFAULT NULL COMMENT '评论人ID',
  `content` text COLLATE utf8mb4_unicode_ci COMMENT '评论内容',
  `attachments` json DEFAULT NULL COMMENT '评论附件',
  `is_edited` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '是否已编辑',
  PRIMARY KEY (`id`),
  KEY `FK_55866536e2125e25624db4d963b` (`task_id`),
  KEY `FK_42dad5d624ed3008880f73b60bc` (`user_id`),
  CONSTRAINT `FK_42dad5d624ed3008880f73b60bc` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`),
  CONSTRAINT `FK_55866536e2125e25624db4d963b` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_comment`
--

LOCK TABLES `task_comment` WRITE;
/*!40000 ALTER TABLE `task_comment` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_comment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_dependency`
--

DROP TABLE IF EXISTS `task_dependency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_dependency` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `task_id` bigint NOT NULL COMMENT '当前任务ID',
  `dependency_id` bigint NOT NULL COMMENT '依赖的任务ID',
  `dependency_type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '依赖类型',
  `lag_days` int NOT NULL DEFAULT '0' COMMENT '延迟天数（正数表示延迟，负数表示提前）',
  PRIMARY KEY (`id`),
  KEY `FK_96cc9656f4eede3de32c5e28150` (`task_id`),
  KEY `FK_0ddb27e4bcddc535a6d810a4c03` (`dependency_id`),
  CONSTRAINT `FK_0ddb27e4bcddc535a6d810a4c03` FOREIGN KEY (`dependency_id`) REFERENCES `task` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_96cc9656f4eede3de32c5e28150` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_dependency`
--

LOCK TABLES `task_dependency` WRITE;
/*!40000 ALTER TABLE `task_dependency` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_dependency` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_time_log`
--

DROP TABLE IF EXISTS `task_time_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_time_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `task_id` bigint NOT NULL COMMENT '任务ID',
  `hours` decimal(10,2) NOT NULL COMMENT '工时（小时）',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '工作内容描述',
  `work_date` date NOT NULL COMMENT '工作日期',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  PRIMARY KEY (`id`),
  KEY `FK_a1cfdcad8ab305ab69d72fe1ba8` (`task_id`),
  KEY `FK_91e293245ea1efdbf665deb997b` (`user_id`),
  CONSTRAINT `FK_91e293245ea1efdbf665deb997b` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`),
  CONSTRAINT `FK_a1cfdcad8ab305ab69d72fe1ba8` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_time_log`
--

LOCK TABLES `task_time_log` WRITE;
/*!40000 ALTER TABLE `task_time_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_time_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket`
--

DROP TABLE IF EXISTS `ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `task_id` bigint DEFAULT NULL COMMENT '所属任务ID',
  `title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '工单类型',
  `submitter_id` bigint DEFAULT NULL COMMENT '提交人ID',
  `handler_id` bigint DEFAULT NULL COMMENT '处理人ID',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '工单状态',
  `content` text COLLATE utf8mb4_unicode_ci COMMENT '工单内容',
  `attachments` json DEFAULT NULL COMMENT '工单附件',
  `solution` text COLLATE utf8mb4_unicode_ci COMMENT '解决方案',
  `severity` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '3' COMMENT '严重程度',
  `stepsToReproduce` text COLLATE utf8mb4_unicode_ci COMMENT '重现步骤',
  `expectedResult` text COLLATE utf8mb4_unicode_ci COMMENT '期望结果',
  `actualResult` text COLLATE utf8mb4_unicode_ci COMMENT '实际结果',
  `environment` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '环境信息',
  `rootCause` text COLLATE utf8mb4_unicode_ci COMMENT '根因分析',
  `rootCauseCategory` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '根因分类',
  `resolution` text COLLATE utf8mb4_unicode_ci COMMENT '解决方案详细描述',
  `foundInVersion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '发现版本',
  `fixedInVersion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '修复版本',
  `reopenedCount` int NOT NULL DEFAULT '0' COMMENT '重新打开次数',
  `workflowInstanceId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '工作流实例ID',
  `approvalStatus` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '审批状态: 0无需审批 1审批中 2已通过 3已拒绝',
  `currentNodeName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '当前审批节点名称',
  PRIMARY KEY (`id`),
  KEY `FK_17cc52872004472c7a8125fd789` (`project_id`),
  KEY `FK_ee5448bbee46379de71337698da` (`task_id`),
  KEY `FK_5893529267543167f1f31f8ec51` (`submitter_id`),
  KEY `FK_c70edbe1e4e53d579214c567b3d` (`handler_id`),
  CONSTRAINT `FK_17cc52872004472c7a8125fd789` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `FK_5893529267543167f1f31f8ec51` FOREIGN KEY (`submitter_id`) REFERENCES `sys_user` (`id`),
  CONSTRAINT `FK_c70edbe1e4e53d579214c567b3d` FOREIGN KEY (`handler_id`) REFERENCES `sys_user` (`id`),
  CONSTRAINT `FK_ee5448bbee46379de71337698da` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket`
--

LOCK TABLES `ticket` WRITE;
/*!40000 ALTER TABLE `ticket` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_story`
--

DROP TABLE IF EXISTS `user_story`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_story` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '故事描述（As a... I want... So that...）',
  `type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2' COMMENT '类型：1史诗 2故事 3任务',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '状态',
  `storyPoints` int NOT NULL DEFAULT '0' COMMENT '故事点',
  `acceptance_criteria` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '验收标准',
  `priority` int NOT NULL DEFAULT '0' COMMENT '优先级（数字越小优先级越高）',
  `sprint_id` bigint DEFAULT NULL COMMENT '所属Sprint ID',
  `parent_id` bigint DEFAULT NULL COMMENT '父故事ID（用于史诗分解）',
  `assignee_id` bigint DEFAULT NULL COMMENT '负责人ID',
  `reporter_id` bigint DEFAULT NULL COMMENT '报告人ID',
  `project_id` bigint DEFAULT NULL COMMENT '关联项目ID',
  `estimated_date` datetime DEFAULT NULL COMMENT '预估完成日期',
  `completed_date` datetime DEFAULT NULL COMMENT '实际完成日期',
  PRIMARY KEY (`id`),
  KEY `FK_22788aa41360c2fce09d31d8d6b` (`sprint_id`),
  KEY `FK_d911f3dafca8599c2601a74bbf7` (`parent_id`),
  KEY `FK_f61052eef553ab11c1c261d48ad` (`assignee_id`),
  KEY `FK_0fbfc90f1be845bcb3caef1141d` (`reporter_id`),
  KEY `FK_443b0bff9788f060fe1a8ba617b` (`project_id`),
  CONSTRAINT `FK_0fbfc90f1be845bcb3caef1141d` FOREIGN KEY (`reporter_id`) REFERENCES `sys_user` (`id`),
  CONSTRAINT `FK_22788aa41360c2fce09d31d8d6b` FOREIGN KEY (`sprint_id`) REFERENCES `sprint` (`id`),
  CONSTRAINT `FK_443b0bff9788f060fe1a8ba617b` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `FK_d911f3dafca8599c2601a74bbf7` FOREIGN KEY (`parent_id`) REFERENCES `user_story` (`id`),
  CONSTRAINT `FK_f61052eef553ab11c1c261d48ad` FOREIGN KEY (`assignee_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_story`
--

LOCK TABLES `user_story` WRITE;
/*!40000 ALTER TABLE `user_story` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_story` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wf_business_config`
--

DROP TABLE IF EXISTS `wf_business_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wf_business_config` (
  `business_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '业务对象类型',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '业务对象名称',
  `table_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '对应的数据库表名',
  `id_field` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'id' COMMENT 'ID字段名',
  `field_definitions` text COLLATE utf8mb4_unicode_ci COMMENT '字段定义JSON',
  `data_loader_class` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '数据加载器类名',
  `trigger_config` json DEFAULT NULL COMMENT '触发时机配置',
  `is_active` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '是否启用',
  PRIMARY KEY (`business_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wf_business_config`
--

LOCK TABLES `wf_business_config` WRITE;
/*!40000 ALTER TABLE `wf_business_config` DISABLE KEYS */;
INSERT INTO `wf_business_config` VALUES ('change','变更请求','changes','id',NULL,NULL,'{\"onCreate\": {\"name\": \"变更创建审批\", \"enabled\": true, \"triggerEvent\": \"onCreate\", \"businessScene\": \"approval\"}}','1'),('customer','客户','customers','id',NULL,NULL,'{\"onCreate\": {\"name\": \"客户创建审批\", \"enabled\": true, \"triggerEvent\": \"onCreate\", \"businessScene\": \"approval\"}}','1'),('project','项目','project','id',NULL,'ProjectLoader','{\"onCreate\": {\"name\": \"项目立项审批\", \"enabled\": true, \"triggerEvent\": \"onCreate\", \"businessScene\": \"initiation\"}, \"onStatusChange\": {\"name\": \"项目结项审批\", \"enabled\": true, \"triggerEvent\": \"onStatusChange\", \"businessScene\": \"closure\", \"statusTriggerValues\": [\"6\"]}}','1'),('task','任务','task','id',NULL,NULL,'{\"onCreate\": {\"name\": \"任务创建审批\", \"enabled\": true, \"triggerEvent\": \"onCreate\", \"businessScene\": \"approval\"}}','1'),('ticket','工单','tickets','id',NULL,NULL,'{\"onCreate\": {\"name\": \"工单创建审批\", \"enabled\": true, \"triggerEvent\": \"onCreate\", \"businessScene\": \"approval\"}, \"onStatusChange\": {\"name\": \"工单状态审批\", \"enabled\": true, \"triggerEvent\": \"onStatusChange\", \"businessScene\": \"approval\", \"statusTriggerValues\": [\"3\", \"4\"]}}','1');
/*!40000 ALTER TABLE `wf_business_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wf_definition`
--

DROP TABLE IF EXISTS `wf_definition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wf_definition` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '流程名称',
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '流程编码',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '流程描述',
  `version` int NOT NULL DEFAULT '1' COMMENT '版本号',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '流程分类',
  `nodes` json DEFAULT NULL COMMENT '节点配置JSON',
  `flows` json DEFAULT NULL COMMENT '连接线配置JSON',
  `global_config` json DEFAULT NULL COMMENT '全局配置',
  `is_active` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '是否启用',
  `business_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关联业务对象类型',
  `business_scene` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '业务场景',
  `trigger_event` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '触发事件',
  `status_trigger_values` json DEFAULT NULL COMMENT '状态触发值',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wf_definition`
--

LOCK TABLES `wf_definition` WRITE;
/*!40000 ALTER TABLE `wf_definition` DISABLE KEYS */;
INSERT INTO `wf_definition` VALUES (1,'2026-04-15 13:14:04','system',NULL,NULL,NULL,'请假审批流程','leave-approval','员工请假审批流程，包含部门经理和HR两级审批',1,'hr','[{\"x\": 100, \"y\": 200, \"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"x\": 300, \"y\": 200, \"id\": \"approval_1\", \"name\": \"部门经理审批\", \"type\": \"approval\", \"properties\": {\"roleId\": \"dept-manager\", \"assigneeType\": \"role\"}}, {\"x\": 500, \"y\": 200, \"id\": \"approval_2\", \"name\": \"HR审批\", \"type\": \"approval\", \"properties\": {\"roleId\": \"hr\", \"assigneeType\": \"role\"}}, {\"x\": 700, \"y\": 200, \"id\": \"notification_1\", \"name\": \"通知申请人\", \"type\": \"notification\", \"properties\": {\"notificationType\": \"system\", \"notificationReceiverExpr\": \"${initiator}\"}}, {\"x\": 900, \"y\": 200, \"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"id\": \"flow_1\", \"sourceNodeId\": \"start_1\", \"targetNodeId\": \"approval_1\"}, {\"id\": \"flow_2\", \"sourceNodeId\": \"approval_1\", \"targetNodeId\": \"approval_2\"}, {\"id\": \"flow_3\", \"sourceNodeId\": \"approval_2\", \"targetNodeId\": \"notification_1\"}, {\"id\": \"flow_4\", \"sourceNodeId\": \"notification_1\", \"targetNodeId\": \"end_1\"}]',NULL,'1',NULL,NULL,NULL,NULL),(2,'2026-04-15 13:14:04','system',NULL,'system',NULL,'任务审批流程','TASK_APPROVAL','任务审批流程',1,'task','[{\"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"id\": \"approval_1\", \"name\": \"任务负责人审批\", \"type\": \"approval\", \"properties\": {\"fieldPath\": \"leader.id\", \"assigneeType\": \"business_field\", \"businessType\": \"task\", \"assigneeEmptyAction\": \"error\"}}, {\"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"id\": \"flow_start_approval\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"start_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"approval_1\"}, {\"id\": \"flow_approval_end\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"approval_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"end_1\"}]','{}','1','task','approval','manual',NULL),(3,'2026-04-15 13:14:04','system',NULL,'system',NULL,'工单审批流程','TICKET_APPROVAL','工单审批流程',1,'ticket','[{\"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"id\": \"approval_1\", \"name\": \"工单处理人审批\", \"type\": \"approval\", \"properties\": {\"fieldPath\": \"handlerId\", \"assigneeType\": \"business_field\", \"businessType\": \"ticket\", \"assigneeEmptyAction\": \"assign_to\", \"assigneeEmptyFallbackFieldPath\": \"submitterId\"}}, {\"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"id\": \"flow_start_approval\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"start_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"approval_1\"}, {\"id\": \"flow_approval_end\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"approval_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"end_1\"}]','{}','1','ticket','approval','manual',NULL),(4,'2026-04-15 13:14:04','system',NULL,'system',NULL,'变更审批流程','CHANGE_APPROVAL','变更审批流程',1,'change','[{\"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"id\": \"approval_1\", \"name\": \"变更审批人审批\", \"type\": \"approval\", \"properties\": {\"fieldPath\": \"approverId\", \"assigneeType\": \"business_field\", \"businessType\": \"change\", \"assigneeEmptyAction\": \"assign_to\", \"assigneeEmptyFallbackFieldPath\": \"project.leaderId\"}}, {\"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"id\": \"flow_start_approval\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"start_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"approval_1\"}, {\"id\": \"flow_approval_end\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"approval_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"end_1\"}]','{}','1','change','approval','manual',NULL),(5,'2026-04-15 13:14:04','system',NULL,'system',NULL,'客户审批流程','CUSTOMER_APPROVAL','客户审批流程',1,'customer','[{\"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"id\": \"approval_1\", \"name\": \"销售负责人审批\", \"type\": \"approval\", \"properties\": {\"fieldPath\": \"salesId\", \"assigneeType\": \"business_field\", \"businessType\": \"customer\", \"assigneeEmptyAction\": \"error\"}}, {\"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"id\": \"flow_start_approval\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"start_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"approval_1\"}, {\"id\": \"flow_approval_end\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"approval_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"end_1\"}]','{}','1','customer','approval','manual',NULL),(6,'2026-04-15 13:14:04','system',NULL,'system',NULL,'项目立项审批','PROJECT_APPROVAL','项目立项审批流程',1,'project','[{\"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"id\": \"approval_1\", \"name\": \"交付经理审批\", \"type\": \"approval\", \"properties\": {\"fieldPath\": \"memberGroups.2\", \"assigneeType\": \"business_field\", \"businessType\": \"project\", \"assigneeEmptyAction\": \"assign_to\", \"assigneeEmptyFallbackFieldPath\": \"memberGroups.1\"}}, {\"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"sourceNodeId\": \"start_1\", \"targetNodeId\": \"approval_1\"}, {\"sourceNodeId\": \"approval_1\", \"targetNodeId\": \"end_1\"}]','{}','1','project',NULL,'manual',NULL),(7,'2026-04-15 13:14:04','system',NULL,'system',NULL,'项目结项审批','PROJECT_CLOSE_APPROVAL','项目结项审批流程',1,'project','[{\"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"id\": \"approval_1\", \"name\": \"测试负责人审批\", \"type\": \"approval\", \"properties\": {\"fieldPath\": \"memberGroups.5\", \"assigneeType\": \"business_field\", \"businessType\": \"project\", \"assigneeEmptyAction\": \"assign_to\", \"assigneeEmptyFallbackFieldPath\": \"memberGroups.2\"}}, {\"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"sourceNodeId\": \"start_1\", \"targetNodeId\": \"approval_1\"}, {\"sourceNodeId\": \"approval_1\", \"targetNodeId\": \"end_1\"}]','{}','1','project',NULL,'manual',NULL);
/*!40000 ALTER TABLE `wf_definition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wf_field_mapping`
--

DROP TABLE IF EXISTS `wf_field_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wf_field_mapping` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `business_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '业务类型',
  `field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '字段名称',
  `field_label` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '字段显示名称',
  `resolve_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '解析字段(数据库列名)',
  `resolve_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '解析类型: userId, userIds, deptId',
  `relation_path` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关联路径(可选)',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '描述',
  `enabled` tinyint NOT NULL DEFAULT '1' COMMENT '是否启用',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wf_field_mapping`
--

LOCK TABLES `wf_field_mapping` WRITE;
/*!40000 ALTER TABLE `wf_field_mapping` DISABLE KEYS */;
/*!40000 ALTER TABLE `wf_field_mapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wf_history`
--

DROP TABLE IF EXISTS `wf_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wf_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `instance_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '流程实例ID',
  `task_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关联任务ID',
  `node_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '节点ID',
  `node_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '节点名称',
  `operator_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作人ID',
  `operator_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作人名称',
  `action` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作类型',
  `comment` text COLLATE utf8mb4_unicode_ci COMMENT '操作意见',
  `variables` json DEFAULT NULL COMMENT '当时变量状态',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wf_history`
--

LOCK TABLES `wf_history` WRITE;
/*!40000 ALTER TABLE `wf_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `wf_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wf_instance`
--

DROP TABLE IF EXISTS `wf_instance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wf_instance` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `definition_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '流程定义ID',
  `definition_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '流程定义编码',
  `business_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '业务数据ID',
  `starter_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '发起人ID',
  `current_node_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '当前节点ID',
  `variables` json DEFAULT NULL COMMENT '流程变量JSON',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '状态:1进行中 2已完成 3已取消 4已挂起',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `duration` bigint DEFAULT NULL COMMENT '耗时(毫秒)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wf_instance`
--

LOCK TABLES `wf_instance` WRITE;
/*!40000 ALTER TABLE `wf_instance` DISABLE KEYS */;
/*!40000 ALTER TABLE `wf_instance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wf_task`
--

DROP TABLE IF EXISTS `wf_task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wf_task` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `instance_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '流程实例ID',
  `node_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '节点ID',
  `node_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '节点名称',
  `node_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '节点类型',
  `assignee_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审批人ID',
  `assignee_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审批人名称',
  `candidate_ids` json DEFAULT NULL COMMENT '候选审批人ID列表JSON',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '状态: 1待处理 2处理中 3已完成 4已取消',
  `action` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审批动作: 1同意 2拒绝 3撤回 4转交',
  `comment` text COLLATE utf8mb4_unicode_ci COMMENT '审批意见',
  `input_data` json DEFAULT NULL COMMENT '输入数据JSON',
  `output_data` json DEFAULT NULL COMMENT '输出数据JSON',
  `start_time` datetime DEFAULT NULL COMMENT '任务开始时间',
  `complete_time` datetime DEFAULT NULL COMMENT '完成时间',
  `duration` bigint DEFAULT NULL COMMENT '处理耗时(毫秒)',
  `due_time` datetime DEFAULT NULL COMMENT '到期时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wf_task`
--

LOCK TABLES `wf_task` WRITE;
/*!40000 ALTER TABLE `wf_task` DISABLE KEYS */;
/*!40000 ALTER TABLE `wf_task` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-15 14:24:24
