CREATE TABLE `recipes` (
  `userId` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `text` varchar(800) NOT NULL,
  `keyIngredients` varchar(8000) NOT NULL DEFAULT '[]',
  `commonIngredients` varchar(8000) NOT NULL DEFAULT '[]',
  `id` int NOT NULL,
  PRIMARY KEY (`userId`,`id`),
  CONSTRAINT `recipeFK` FOREIGN KEY (`userId`) REFERENCES `users` (`idusers`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

