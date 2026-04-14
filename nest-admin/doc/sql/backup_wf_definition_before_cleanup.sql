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

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'fbc96e28-31b6-11f1-bd92-e06c7b264a02:1-16796';

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
  `business_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关联业务对象类型',
  `trigger_event` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '触发事件',
  `status_trigger_values` json DEFAULT NULL COMMENT '状态触发值',
  `nodes` json DEFAULT NULL COMMENT '节点配置JSON',
  `flows` json DEFAULT NULL COMMENT '连接线配置JSON',
  `global_config` json DEFAULT NULL COMMENT '全局配置',
  `is_active` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '是否启用',
  `business_scene` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '业务场景',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wf_definition`
--

LOCK TABLES `wf_definition` WRITE;
/*!40000 ALTER TABLE `wf_definition` DISABLE KEYS */;
INSERT INTO `wf_definition` VALUES (2,'2026-04-12 12:19:26','NestAdmin','2026-04-12 18:19:26',NULL,'1','3132123','12312313',NULL,1,'Project','project','onCreate',NULL,NULL,NULL,NULL,'1',NULL),(3,'2026-04-12 12:22:17','NestAdmin','2026-04-12 18:19:32',NULL,'1','测试','ceshi','1231231',1,'Other','project','onCreate',NULL,NULL,NULL,NULL,'1',NULL),(4,'2026-04-12 18:19:57','NestAdmin','2026-04-12 18:23:05','NestAdmin',NULL,'项目新建','WF_project_2026040001','',1,'','project','onCreate',NULL,'[{\"x\": 347, \"y\": 79, \"id\": \"node_start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"x\": 346, \"y\": 497, \"id\": \"node_end_3\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}, {\"x\": 347, \"y\": 218, \"id\": \"node_approval_4\", \"name\": \"审批\", \"type\": \"approval\", \"properties\": {\"allowRollback\": false, \"approverConfig\": {\"deptId\": \"\", \"roleId\": \"\", \"fieldPath\": \"\", \"expression\": \"\", \"assigneeType\": \"user\", \"businessType\": \"project\", \"assigneeValue\": [\"3\"], \"multiInstanceType\": \"sequential\", \"assigneeEmptyAction\": \"error\", \"assigneeEmptyFallbackUserId\": \"\"}}}, {\"x\": 346, \"y\": 360, \"id\": \"node_approval_5\", \"name\": \"审批\", \"type\": \"approval\", \"properties\": {\"allowRollback\": false, \"approverConfig\": {\"deptId\": \"\", \"roleId\": \"\", \"fieldPath\": \"leader\", \"expression\": \"\", \"assigneeType\": \"field\", \"businessType\": \"project\", \"assigneeValue\": \"\", \"multiInstanceType\": \"sequential\", \"assigneeEmptyAction\": \"error\", \"assigneeEmptyFallbackUserId\": \"\"}}}]','[{\"id\": \"flow_node_start_1_node_approval_4_1775995664202\", \"sourceAnchor\": \"bottom\", \"sourceNodeId\": \"node_start_1\", \"targetAnchor\": \"top\", \"targetNodeId\": \"node_approval_4\"}, {\"id\": \"flow_node_approval_4_node_approval_5_1775995675068\", \"sourceAnchor\": \"bottom\", \"sourceNodeId\": \"node_approval_4\", \"targetAnchor\": \"top\", \"targetNodeId\": \"node_approval_5\"}, {\"id\": \"flow_node_approval_5_node_end_3_1775995678501\", \"sourceAnchor\": \"bottom\", \"sourceNodeId\": \"node_approval_5\", \"targetAnchor\": \"top\", \"targetNodeId\": \"node_end_3\"}]',NULL,'1',NULL),(5,'2026-04-14 12:26:20','system','2026-04-14 13:33:08','system','1','项目立项审批','PROJECT_APPROVAL','项目立项审批流程',1,'project','project','manual',NULL,'[{\"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"id\": \"approval_1\", \"name\": \"交付经理审批\", \"type\": \"approval\", \"properties\": {\"fieldPath\": \"coreMembers.deliveryManager.id\", \"assigneeType\": \"field\", \"businessType\": \"project\", \"assigneeEmptyAction\": \"assign_to\", \"assigneeEmptyFallbackFieldPath\": \"coreMembers.projectManager.id\"}}, {\"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"sourceNodeId\": \"start_1\", \"targetNodeId\": \"approval_1\"}, {\"sourceNodeId\": \"approval_1\", \"targetNodeId\": \"end_1\"}]','{}','0',NULL),(6,'2026-04-14 12:26:20','system','2026-04-14 17:18:24','system',NULL,'项目结项审批','PROJECT_CLOSE_APPROVAL','项目结项审批流程',1,'project','project','manual',NULL,'[{\"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"id\": \"approval_1\", \"name\": \"测试负责人审批\", \"type\": \"approval\", \"properties\": {\"fieldPath\": \"memberGroups.5\", \"assigneeType\": \"business_field\", \"businessType\": \"project\", \"assigneeEmptyAction\": \"assign_to\", \"assigneeEmptyFallbackFieldPath\": \"memberGroups.2\"}}, {\"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"sourceNodeId\": \"start_1\", \"targetNodeId\": \"approval_1\"}, {\"sourceNodeId\": \"approval_1\", \"targetNodeId\": \"end_1\"}]','{}','1','closure'),(7,'2026-04-14 15:31:45','system','2026-04-14 15:45:46','NestAdmin',NULL,'项目立项审批','PROJECT_APPROVAL','项目立项审批流程',1,'Other','project','manual',NULL,'[{\"x\": 408, \"y\": 18, \"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"x\": 411, \"y\": 197, \"id\": \"approval_1\", \"name\": \"交付经理审批\", \"type\": \"approval\", \"properties\": {\"fieldPath\": \"memberGroups.2\", \"assigneeType\": \"business_field\", \"businessType\": \"project\", \"allowRollback\": true, \"approverConfig\": {\"fieldPath\": \"leader.id\", \"assigneeType\": \"business_field\", \"businessType\": \"project\", \"departmentId\": \"\", \"assigneeValue\": \"\", \"departmentMode\": \"leader\", \"multiInstanceType\": \"sequential\", \"assigneeEmptyAction\": \"error\", \"assigneeEmptyFallbackUserId\": \"\"}, \"assigneeEmptyAction\": \"assign_to\", \"assigneeEmptyFallbackFieldPath\": \"memberGroups.1\"}}, {\"x\": 406, \"y\": 516, \"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"id\": \"flow_start_1_approval_1_1776167653979\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"bottom\", \"sourceNodeId\": \"start_1\", \"targetAnchor\": \"top\", \"targetNodeId\": \"approval_1\"}, {\"id\": \"flow_approval_1_end_1_1776168044413\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"bottom\", \"sourceNodeId\": \"approval_1\", \"targetAnchor\": \"top\", \"targetNodeId\": \"end_1\"}]','{}','1','initiation'),(8,'2026-04-14 20:03:30','system','2026-04-14 21:45:21','NestAdmin',NULL,'任务审批流程','TASK_APPROVAL','任务审批流程',1,'task','task','manual',NULL,'[{\"x\": 110, \"y\": 19, \"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"x\": 108, \"y\": 216, \"id\": \"approval_1\", \"name\": \"任务负责人审批\", \"type\": \"approval\", \"properties\": {\"fieldPath\": \"leader.id\", \"assigneeType\": \"business_field\", \"businessType\": \"task\", \"allowRollback\": true, \"approverConfig\": {\"fieldPath\": \"leader.id\", \"assigneeType\": \"business_field\", \"businessType\": \"task\", \"departmentId\": \"\", \"assigneeValue\": \"\", \"departmentMode\": \"leader\", \"multiInstanceType\": \"sequential\", \"assigneeEmptyAction\": \"error\", \"assigneeEmptyFallbackUserId\": \"\"}, \"assigneeEmptyAction\": \"error\"}}, {\"x\": 115, \"y\": 388, \"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"id\": \"flow_start_approval\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"bottom\", \"sourceNodeId\": \"start_1\", \"targetAnchor\": \"top\", \"targetNodeId\": \"approval_1\"}, {\"id\": \"flow_approval_end\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"bottom\", \"sourceNodeId\": \"approval_1\", \"targetAnchor\": \"top\", \"targetNodeId\": \"end_1\"}]','{}','1','approval'),(9,'2026-04-14 20:03:30','system',NULL,'system',NULL,'工单审批流程','TICKET_APPROVAL','工单审批流程',1,'ticket','ticket','manual',NULL,'[{\"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"id\": \"approval_1\", \"name\": \"工单处理人审批\", \"type\": \"approval\", \"properties\": {\"fieldPath\": \"handlerId\", \"assigneeType\": \"business_field\", \"businessType\": \"ticket\", \"assigneeEmptyAction\": \"assign_to\", \"assigneeEmptyFallbackFieldPath\": \"submitterId\"}}, {\"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"id\": \"flow_start_approval\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"start_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"approval_1\"}, {\"id\": \"flow_approval_end\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"approval_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"end_1\"}]','{}','1','approval'),(10,'2026-04-14 20:03:30','system',NULL,'system',NULL,'变更审批流程','CHANGE_APPROVAL','变更审批流程',1,'change','change','manual',NULL,'[{\"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"id\": \"approval_1\", \"name\": \"变更审批人审批\", \"type\": \"approval\", \"properties\": {\"fieldPath\": \"approverId\", \"assigneeType\": \"business_field\", \"businessType\": \"change\", \"assigneeEmptyAction\": \"assign_to\", \"assigneeEmptyFallbackFieldPath\": \"project.leaderId\"}}, {\"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"id\": \"flow_start_approval\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"start_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"approval_1\"}, {\"id\": \"flow_approval_end\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"approval_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"end_1\"}]','{}','1','approval'),(11,'2026-04-14 20:03:30','system',NULL,'system',NULL,'客户审批流程','CUSTOMER_APPROVAL','客户审批流程',1,'customer','customer','manual',NULL,'[{\"id\": \"start_1\", \"name\": \"开始\", \"type\": \"start\", \"properties\": {}}, {\"id\": \"approval_1\", \"name\": \"销售负责人审批\", \"type\": \"approval\", \"properties\": {\"fieldPath\": \"salesId\", \"assigneeType\": \"business_field\", \"businessType\": \"customer\", \"assigneeEmptyAction\": \"error\"}}, {\"id\": \"end_1\", \"name\": \"结束\", \"type\": \"end\", \"properties\": {}}]','[{\"id\": \"flow_start_approval\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"start_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"approval_1\"}, {\"id\": \"flow_approval_end\", \"flowType\": \"normal\", \"conditionId\": \"\", \"sourceAnchor\": \"right\", \"sourceNodeId\": \"approval_1\", \"targetAnchor\": \"left\", \"targetNodeId\": \"end_1\"}]','{}','1','approval');
/*!40000 ALTER TABLE `wf_definition` ENABLE KEYS */;
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

-- Dump completed on 2026-04-14 21:58:50
