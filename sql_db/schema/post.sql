CREATE TABLE IF NOT EXISTS `post` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `userid` int(12) NOT NULL,
  `type` enum('item','link','place','person') NOT NULL,
  `title` varchar(255) NOT NULL,
  `comment` text,
  `updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `title` (`title`)
);
