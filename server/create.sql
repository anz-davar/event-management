
-- First, drop all existing tables (in the correct order to respect foreign key constraints)
DROP TABLE IF EXISTS `seatingarrangement`;
DROP TABLE IF EXISTS `tables`;
DROP TABLE IF EXISTS `guests`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `halls`;
DROP TABLE IF EXISTS `users`;

-- Now create the tables in the proper order
-- Table: users
CREATE TABLE `users` (
  `UserID` INT NOT NULL AUTO_INCREMENT,
  `Username` VARCHAR(50) NOT NULL UNIQUE,
  `Password` VARCHAR(255) NOT NULL,
  `Email` VARCHAR(100) NOT NULL UNIQUE,
  `Role` VARCHAR(100) NOT NULL,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: halls
CREATE TABLE `halls` (
  `HallID` INT NOT NULL AUTO_INCREMENT,
  `HallName` VARCHAR(100) NOT NULL UNIQUE,
  `MaxCapacity` INT NOT NULL,
  `Location` VARCHAR(255) NOT NULL,
  `EventType` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`HallID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: tables (now connected to halls)
CREATE TABLE `tables` (
  `TableID` INT NOT NULL AUTO_INCREMENT,
  `HallID` INT NOT NULL,
  `MaxSeats` INT NOT NULL,
  `TableLocation` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`TableID`),
  UNIQUE KEY `unique_table_hall` (`TableLocation`, `HallID`),
  KEY `HallID` (`HallID`),
  CONSTRAINT `tables_ibfk_1` FOREIGN KEY (`HallID`) REFERENCES `halls` (`HallID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: events (now connected to halls)
CREATE TABLE `events` (
  `EventID` INT NOT NULL AUTO_INCREMENT,
  `UserID` INT NOT NULL,
  `HallID` INT NOT NULL,
  `EventName` VARCHAR(100) NOT NULL,
   location VARCHAR(255) not null,
  `EventDate` DATE NOT NULL,
  `MaxGuests` INT NOT NULL,
  PRIMARY KEY (`EventID`),
  KEY `UserID` (`UserID`),
  KEY `HallID` (`HallID`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `events_ibfk_2` FOREIGN KEY (`HallID`) REFERENCES `halls` (`HallID`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: guests
CREATE TABLE `guests` (
  `GuestID` INT NOT NULL AUTO_INCREMENT,
  `EventID` INT NOT NULL,
  `FullName` VARCHAR(100) NOT NULL,
  `ContactInfo` VARCHAR(100) DEFAULT NULL,
  `Preferences` VARCHAR(100) DEFAULT NULL,
  `Restrictions` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`GuestID`),
  KEY `EventID` (`EventID`),
  CONSTRAINT `guests_ibfk_1` FOREIGN KEY (`EventID`) REFERENCES `events` (`EventID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: event_tables (connects tables to events)
CREATE TABLE `event_tables` (
  `EventTableID` INT NOT NULL AUTO_INCREMENT,
  `EventID` INT NOT NULL,
  `TableID` INT NOT NULL,
  `IsActive` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`EventTableID`),
  UNIQUE KEY `unique_event_table` (`EventID`, `TableID`),
  KEY `EventID` (`EventID`),
  KEY `TableID` (`TableID`),
  CONSTRAINT `event_tables_ibfk_1` FOREIGN KEY (`EventID`) REFERENCES `events` (`EventID`) ON DELETE CASCADE,
  CONSTRAINT `event_tables_ibfk_2` FOREIGN KEY (`TableID`) REFERENCES `tables` (`TableID`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: seatingarrangement
CREATE TABLE `seatingarrangement` (
  `SeatingID` INT NOT NULL AUTO_INCREMENT,
  `GuestID` INT NOT NULL,
  `EventTableID` INT NOT NULL,
  `SeatNumber` INT DEFAULT NULL,
  PRIMARY KEY (`SeatingID`),
  UNIQUE KEY `unique_guest_seating` (`GuestID`),
  UNIQUE KEY `unique_seat_at_table` (`EventTableID`, `SeatNumber`),
  KEY `GuestID` (`GuestID`),
  KEY `EventTableID` (`EventTableID`),
  CONSTRAINT `seatingarrangement_ibfk_1` FOREIGN KEY (`GuestID`) REFERENCES `guests` (`GuestID`) ON DELETE CASCADE,
  CONSTRAINT `seatingarrangement_ibfk_2` FOREIGN KEY (`EventTableID`) REFERENCES `event_tables` (`EventTableID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `event_tables`
    DROP FOREIGN KEY `event_tables_ibfk_2`;

ALTER TABLE `event_tables`
    ADD CONSTRAINT `event_tables_ibfk_2`
        FOREIGN KEY (`TableID`)
            REFERENCES `tables` (`TableID`)
            ON DELETE CASCADE;

ALTER TABLE tables ADD COLUMN IsAccessible BOOLEAN DEFAULT 0;
ALTER TABLE guests ADD COLUMN NeedsAccessibleTable BOOLEAN DEFAULT 0;
ALTER TABLE `tables` DROP INDEX `unique_table_hall`;
