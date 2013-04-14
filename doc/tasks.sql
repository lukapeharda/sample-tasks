SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

CREATE SCHEMA IF NOT EXISTS `tasks` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ;
USE `tasks` ;

-- -----------------------------------------------------
-- Table `tasks`.`project`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `tasks`.`project` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `name` VARCHAR(100) NULL ,
  PRIMARY KEY (`id`) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tasks`.`task`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `tasks`.`task` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `task` TEXT NOT NULL ,
  `project_id` INT UNSIGNED NOT NULL ,
  `date_created` DATETIME NULL ,
  `date_due` DATETIME NULL ,
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 0 ,
  PRIMARY KEY (`id`) ,
  INDEX `belongs_to` (`project_id` ASC) ,
  CONSTRAINT `belongs_to`
    FOREIGN KEY (`project_id` )
    REFERENCES `tasks`.`project` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;



SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
