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
  `approvalStatus` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '审批状态: 0无需审批 1审批中 2已通过 3已驳回',
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
  `owner_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_3f20acac3d49d72d8175de15567` (`customer_id`),
  KEY `FK_2fb64fb8e2e9f7fae2e19b0e93b` (`owner_id`),
  CONSTRAINT `FK_2fb64fb8e2e9f7fae2e19b0e93b` FOREIGN KEY (`owner_id`) REFERENCES `sys_user` (`id`),
  CONSTRAINT `FK_3f20acac3d49d72d8175de15567` FOREIGN KEY (`customer_id`) REFERENCES `crm_customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  `deptId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '所属部门ID',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '客户描述',
  `extraInfo` json DEFAULT NULL COMMENT '扩展信息',
  `customerValue` decimal(14,2) DEFAULT NULL COMMENT '客户价值(万元)',
  `workflowInstanceId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '工作流实例ID',
  `approvalStatus` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '审批状态: 0无需审批 1审批中 2已通过 3已驳回',
  `currentNodeName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '当前审批节点名称',
  `sales_id` bigint DEFAULT NULL COMMENT '销售负责人ID',
  PRIMARY KEY (`id`),
  KEY `FK_c28897c5757ba61ddb11cdd7aad` (`sales_id`),
  CONSTRAINT `FK_c28897c5757ba61ddb11cdd7aad` FOREIGN KEY (`sales_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  `approvalStatus` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '审批状态: 0无需审批 1审批中 2已通过 3已驳回',
  `currentNodeName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '当前审批节点名称',
  `customer_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_e6a130ca187ac0e495333cf4d47` (`leader_id`),
  KEY `FK_9822110bfde667efe4165da219e` (`customer_id`),
  CONSTRAINT `FK_9822110bfde667efe4165da219e` FOREIGN KEY (`customer_id`) REFERENCES `crm_customer` (`id`),
  CONSTRAINT `FK_e6a130ca187ac0e495333cf4d47` FOREIGN KEY (`leader_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=199 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  `attachments` json DEFAULT NULL COMMENT '任务附件',
  `estimatedHours` int DEFAULT NULL COMMENT '预估工时（小时）',
  `actualHours` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '实际工时（小时）',
  `remainingHours` int DEFAULT NULL COMMENT '剩余工时（小时）',
  `storyPoints` int DEFAULT NULL COMMENT '故事点',
  `workflowInstanceId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '工作流实例ID',
  `approvalStatus` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '审批状态: 0无需审批 1审批中 2已通过 3已驳回',
  `currentNodeName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '当前审批节点名称',
  `description` longtext COLLATE utf8mb4_unicode_ci COMMENT '任务描述',
  `acceptanceCriteria` longtext COLLATE utf8mb4_unicode_ci COMMENT '验收标准',
  PRIMARY KEY (`id`),
  KEY `FK_1f53e7ffe94530f9e0221224d29` (`project_id`),
  KEY `FK_422c15d3980fd646448d61f61d8` (`sprint_id`),
  KEY `FK_9842b316550eb144b19a766bad9` (`leader_id`),
  KEY `FK_5b12d07794e1d6428696b35fd7e` (`parent_id`),
  CONSTRAINT `FK_1f53e7ffe94530f9e0221224d29` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `FK_422c15d3980fd646448d61f61d8` FOREIGN KEY (`sprint_id`) REFERENCES `sprint` (`id`),
  CONSTRAINT `FK_5b12d07794e1d6428696b35fd7e` FOREIGN KEY (`parent_id`) REFERENCES `task` (`id`),
  CONSTRAINT `FK_9842b316550eb144b19a766bad9` FOREIGN KEY (`leader_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  `attachments` json DEFAULT NULL COMMENT '汇报附件',
  `progress` int DEFAULT NULL COMMENT '汇报时任务进度（0-100）',
  PRIMARY KEY (`id`),
  KEY `FK_a1cfdcad8ab305ab69d72fe1ba8` (`task_id`),
  KEY `FK_91e293245ea1efdbf665deb997b` (`user_id`),
  CONSTRAINT `FK_91e293245ea1efdbf665deb997b` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`),
  CONSTRAINT `FK_a1cfdcad8ab305ab69d72fe1ba8` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  `approvalStatus` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '审批状态: 0无需审批 1审批中 2已通过 3已驳回',
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
  PRIMARY KEY (`id`),
  KEY `idx_wf_history_instance_time` (`instance_id`,`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  `action` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审批动作: 1同意 2驳回 3撤回 4转交',
  `comment` text COLLATE utf8mb4_unicode_ci COMMENT '审批意见',
  `input_data` json DEFAULT NULL COMMENT '输入数据JSON',
  `output_data` json DEFAULT NULL COMMENT '输出数据JSON',
  `start_time` datetime DEFAULT NULL COMMENT '任务开始时间',
  `complete_time` datetime DEFAULT NULL COMMENT '完成时间',
  `duration` bigint DEFAULT NULL COMMENT '处理耗时(毫秒)',
  `due_time` datetime DEFAULT NULL COMMENT '到期时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-16 10:16:52
