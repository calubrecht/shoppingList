CREATE TABLE `users` (
   `idusers` int(11) NOT NULL AUTO_INCREMENT,
   `login` varchar(45) NOT NULL,
   `fullName` varchar(45) NOT NULL,
   `email` varchar(120) NOT NULL,
   `isAdmin` tinyint(4) NOT NULL DEFAULT '0',
   `pwHash` varchar(80) NOT NULL,
   `ts` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`idusers`),
   UNIQUE KEY `login_UNIQUE` (`login`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=latin1;
