CREATE TABLE `passwordTokens` (
 `userID` int(11) NOT NULL,
 `token` varchar(30) NOT NULL,
 `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (`userID`),
 CONSTRAINT `passwordTokens_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`idusers`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1
