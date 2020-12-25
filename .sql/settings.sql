CREATE TABLE `settings` (
 `userId` int(11) NOT NULL,
 `settingName` varchar(40) NOT NULL,
 `settingValue` varchar(40) NOT NULL,
 PRIMARY KEY (`userId`,`settingName`),
 CONSTRAINT `userSettingsFK` FOREIGN KEY (`userId`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1
