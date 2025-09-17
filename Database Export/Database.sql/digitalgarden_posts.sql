-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: VM005    Database: digitalgarden
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `ID` varchar(36) NOT NULL,
  `PostData` longtext,
  `Stage` enum('DRAFT','LIVE','REMOVED') DEFAULT NULL,
  `UserID` varchar(45) DEFAULT NULL,
  `Posted` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `UserID_idx` (`UserID`),
  CONSTRAINT `UserID` FOREIGN KEY (`UserID`) REFERENCES `users` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES ('0f668b32-853c-439f-8048-640260fd0f8c','{\"ID\":\"0f668b32-853c-439f-8048-640260fd0f8c\",\"Created\":\"15/09/2025 23:25\",\"Modified\":\"15/09/2025 23:25\",\"Author\":\"dc21302d-89e0-11f0-9275-000c298d25c1\"}','DRAFT','dc21302d-89e0-11f0-9275-000c298d25c1',NULL),('374cf6d4-ba94-446b-990a-b846b60de093','{\"ID\":\"374cf6d4-ba94-446b-990a-b846b60de093\",\"Created\":\"15/09/2025 23:25\",\"Modified\":\"15/09/2025 23:25\",\"Author\":\"dc21302d-89e0-11f0-9275-000c298d25c1\"}','DRAFT','dc21302d-89e0-11f0-9275-000c298d25c1',NULL),('51b4da42-04da-4365-80d3-6b302d78d7fe','{\"ID\":\"51b4da42-04da-4365-80d3-6b302d78d7fe\",\"Created\":\"15/09/2025 23:36\",\"Modified\":1757975854795,\"Author\":\"dc21302d-89e0-11f0-9275-000c298d25c1\"}','LIVE','dc21302d-89e0-11f0-9275-000c298d25c1','2025-09-15 23:37:39'),('538e790c-4655-47d8-a774-6fa85e6e6a6d','{\"ID\":\"538e790c-4655-47d8-a774-6fa85e6e6a6d\",\"Created\":\"15/09/2025 23:25\",\"Modified\":\"15/09/2025 23:25\",\"Author\":\"dc21302d-89e0-11f0-9275-000c298d25c1\"}','DRAFT','dc21302d-89e0-11f0-9275-000c298d25c1',NULL),('68e86c0f-5540-4c37-8d0a-878fce25702c','{\"ID\":\"68e86c0f-5540-4c37-8d0a-878fce25702c\",\"Created\":\"15/09/2025 23:25\",\"Modified\":\"15/09/2025 23:25\",\"Author\":\"dc21302d-89e0-11f0-9275-000c298d25c1\"}','DRAFT','dc21302d-89e0-11f0-9275-000c298d25c1',NULL),('7699d13f-e06f-483d-80e4-78efc897ec53','{\"ID\":\"7699d13f-e06f-483d-80e4-78efc897ec53\",\"Created\":\"15/09/2025 23:21\",\"Modified\":\"15/09/2025 23:21\",\"Author\":\"dc21302d-89e0-11f0-9275-000c298d25c1\"}','DRAFT','dc21302d-89e0-11f0-9275-000c298d25c1',NULL),('8d51e60b-f5c9-419c-adea-169bf3ad33d6','{\"ID\":\"8d51e60b-f5c9-419c-adea-169bf3ad33d6\",\"Created\":\"15/09/2025 23:29\",\"Modified\":1757975355945,\"Author\":\"dc21302d-89e0-11f0-9275-000c298d25c1\"}','LIVE','dc21302d-89e0-11f0-9275-000c298d25c1','2025-09-15 23:29:19'),('f1f244ee-1a8c-4bcd-8f8c-8e2e4ff82418','{\"ID\":\"f1f244ee-1a8c-4bcd-8f8c-8e2e4ff82418\",\"Created\":\"15/09/2025 23:25\",\"Modified\":\"15/09/2025 23:25\",\"Author\":\"dc21302d-89e0-11f0-9275-000c298d25c1\"}','DRAFT','dc21302d-89e0-11f0-9275-000c298d25c1',NULL);
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-17 20:51:47
