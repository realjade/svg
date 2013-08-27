# -*- coding: utf-8 -*-
from alter_db import alter_tables

create_sqls = [
'''
ALTER TABLE `code_share` ADD COLUMN `state` INT DEFAULT 0 COMMENT '0:useable,1:outday 2:delete'  AFTER `exposure`;
'''
]

if __name__ == "__main__":
    alter_tables(create_sqls)
