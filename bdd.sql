-- --------------------------------------------------------
-- Hôte:                         127.0.0.1
-- Version du serveur:           8.0.30 - MySQL Community Server - GPL
-- SE du serveur:                Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Listage de la structure de la base pour creche_planning
DROP DATABASE IF EXISTS `creche_planning`;
CREATE DATABASE IF NOT EXISTS `creche_planning` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `creche_planning`;

-- Listage de la structure de table creche_planning. children
DROP TABLE IF EXISTS `children`;
CREATE TABLE IF NOT EXISTS `children` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `age` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `children_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table creche_planning.children : ~3 rows (environ)
DELETE FROM `children`;
INSERT INTO `children` (`id`, `user_id`, `firstname`, `lastname`, `age`) VALUES
	(4, 26, 'paupau', 'rainguez', 8),
	(9, 26, 'Géraldine', 'Griessmann', 7),
	(73, 26, 'alexandre', 'perez', 19);

-- Listage de la structure de table creche_planning. child_schedule_hours
DROP TABLE IF EXISTS `child_schedule_hours`;
CREATE TABLE IF NOT EXISTS `child_schedule_hours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `child_id` int NOT NULL,
  `dayOfWeek` int NOT NULL,
  `daycareHoursStart` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `daycareHoursEnd` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `child_id` (`child_id`),
  KEY `fk_child_schedule_hours_dayOfWeek` (`dayOfWeek`),
  CONSTRAINT `fk_child_schedule_hours_child_id` FOREIGN KEY (`child_id`) REFERENCES `children` (`id`),
  CONSTRAINT `fk_child_schedule_hours_dayOfWeek` FOREIGN KEY (`dayOfWeek`) REFERENCES `jours_semaine` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table creche_planning.child_schedule_hours : ~7 rows (environ)
DELETE FROM `child_schedule_hours`;
INSERT INTO `child_schedule_hours` (`id`, `child_id`, `dayOfWeek`, `daycareHoursStart`, `daycareHoursEnd`) VALUES
	(5, 4, 1, '9', '18'),
	(6, 4, 2, '10', '17'),
	(14, 9, 1, '09:00', '18:00'),
	(15, 9, 4, '09:00', '18:00'),
	(16, 9, 5, '09:00', '18:00'),
	(68, 73, 1, '10:00', '15:00'),
	(69, 73, 3, '', '');

-- Listage de la structure de table creche_planning. employees
DROP TABLE IF EXISTS `employees`;
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `workHours` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table creche_planning.employees : ~2 rows (environ)
DELETE FROM `employees`;
INSERT INTO `employees` (`id`, `user_id`, `firstname`, `lastname`, `workHours`) VALUES
	(15, 26, 'Alexandre', 'Perez', 35),
	(16, 26, 'Pauline', 'Rainguez', 35);

-- Listage de la structure de table creche_planning. employee_schedules
DROP TABLE IF EXISTS `employee_schedules`;
CREATE TABLE IF NOT EXISTS `employee_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `day_id` int NOT NULL,
  `workHoursStart` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `workHoursEnd` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `day_id` (`day_id`),
  CONSTRAINT `employee_schedules_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `employee_schedules_ibfk_2` FOREIGN KEY (`day_id`) REFERENCES `jours_semaine` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table creche_planning.employee_schedules : ~8 rows (environ)
DELETE FROM `employee_schedules`;
INSERT INTO `employee_schedules` (`id`, `employee_id`, `day_id`, `workHoursStart`, `workHoursEnd`) VALUES
	(11, 15, 2, NULL, NULL),
	(12, 15, 3, NULL, NULL),
	(13, 15, 4, NULL, NULL),
	(14, 16, 1, NULL, NULL),
	(15, 16, 2, NULL, NULL),
	(16, 16, 3, NULL, NULL),
	(17, 16, 4, NULL, NULL),
	(18, 16, 5, NULL, NULL);

-- Listage de la structure de table creche_planning. jours_semaine
DROP TABLE IF EXISTS `jours_semaine`;
CREATE TABLE IF NOT EXISTS `jours_semaine` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dayName` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table creche_planning.jours_semaine : ~7 rows (environ)
DELETE FROM `jours_semaine`;
INSERT INTO `jours_semaine` (`id`, `dayName`) VALUES
	(1, 'Lundi'),
	(2, 'Mardi'),
	(3, 'Mercredi'),
	(4, 'Jeudi'),
	(5, 'Vendredi'),
	(6, 'Samedi'),
	(7, 'Dimanche');

-- Listage de la structure de table creche_planning. users
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table creche_planning.users : ~1 rows (environ)
DELETE FROM `users`;
INSERT INTO `users` (`id`, `username`, `password`) VALUES
	(26, 'alex', '$2b$10$XrK6UtFbFlS6/cg.cAcB3.CSXCJTO800qXjvgcE7F5/bc7LIXfe9K');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
