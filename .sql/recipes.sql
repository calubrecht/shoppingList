CREATE TABLE `recipes` (
  `userId` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `text` varchar(800) NOT NULL,
  `keyIngredients` varchar(8000) NOT NULL DEFAULT '[]',
  `commonIngredients` varchar(8000) NOT NULL DEFAULT '[]',
  PRIMARY KEY (`userId`,`name`),
  CONSTRAINT `recipeFK` FOREIGN KEY (`userId`) REFERENCES `users` (`idusers`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
