CREATE TABLE `lists` (
   `userId` int(11) NOT NULL,
   `listType` varchar(10) NOT NULL,
   `orderKey` int(11) NOT NULL,
   `aisle` varchar(32) NOT NULL,
   `name` varchar(80) NOT NULL,
   `count` int(11) NOT NULL,
   `active` tinyint(1) NOT NULL,
   PRIMARY KEY (`userId`,`listType`,`orderKey`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
