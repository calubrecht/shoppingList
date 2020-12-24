CREATE TABLE `lists` (
   `userId` int(11) NOT NULL,
   `listType` varchar(10) NOT NULL,
   `listNameId` int(11) NOT NULL,
   `orderKey` int(11) NOT NULL,
   `id` varchar(80) NOT NULL,
   `aisle` varchar(32) NOT NULL,
   `name` varchar(80) NOT NULL,
   `count` int(11) NOT NULL,
   `active` tinyint(1) NOT NULL,
   `done` tinyint(1) NOT NULL DEFAULT '0',
   PRIMARY KEY (`userId`,`listType`,`listNameId`,`id`) USING BTREE,
   KEY `order` (`userId`,`listType`,`orderKey`),
   CONSTRAINT `listsUserIdFK` FOREIGN KEY (`userId`) REFERENCES `users` (`idusers`) ON DELETE CASCADE ON UPDATE CASCADE,
   CONSTRAINT `listNameIdFK` FOREIGN KEY (`listNameId`) REFERENCES `listNames` (`listNameId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1


CREATE TABLE `listTS` (
  `userId` int NOT NULL,
  `listName` varchar(120) NOT NULL,
  `lastUpdate` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`userId`,`listName`) USING BTREE,
  CONSTRAINT `userFK` FOREIGN KEY (`userId`) REFERENCES `users` (`idusers`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `listNames` (
 `listNameId` int(11) NOT NULL AUTO_INCREMENT,
 `listName` varchar(100) NOT NULL,
 `userId` int(11) NOT NULL,
 PRIMARY KEY (`listNameId`),
 KEY `listNameUser_FK` (`userId`),
 CONSTRAINT `listNameUser_FK` FOREIGN KEY (`userId`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1
