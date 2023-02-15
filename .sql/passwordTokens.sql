CREATE TABLE `passwordTokens` (
 `userID` int(11) NOT NULL,
 `idSource` varchar(50) NOT NULL DEFAULT 'NativeAuthentication',
 `token` varchar(52) NOT NULL,
 `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (`userID`,`idSource`),
) ENGINE=InnoDB DEFAULT CHARSET=latin1
