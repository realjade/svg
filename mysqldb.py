#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Creates shell
"""
from sqlalchemy import *
from sqlalchemy.orm import scoped_session, sessionmaker
from werkzeug.datastructures import CallbackDict
import json

create_sqls = [
'''
create table `user` (
  `id` bigint(20) NOT NULL auto_increment,
  `user_id` varchar(20) not null,
  `nickname` varchar(50),
  `email` varchar(50),
  `username` varchar(50),
  `pw_hash` varchar(100) not null,
  `avatar` varchar(300),
  `extra_f` text,
  `created` bigint(20),
  `updated` bigint(20),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
''',
'''
ALTER TABLE `user` 
ADD UNIQUE INDEX `user_id_index` (`user_id` ASC) 
, ADD INDEX `user_email_index` (`email` ASC) ;
''',

'''
create table `code` (
  `id` bigint(20) NOT NULL auto_increment,
  `code_id` varchar(20) not null,
  `user_id` varchar(20),
  `content` text not null,
  `extra_f` text,
  `created` bigint(20),
  `updated` bigint(20),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
''',
'''
ALTER TABLE `code` 
ADD UNIQUE INDEX `code_id_index` (`code_id` ASC);
''',

'''
create table `code_share` (
  `id` bigint(20) NOT NULL auto_increment,
  `code_id` varchar(20) not null,
  `share_id` varchar(20),
  `title` varchar(200),
  `language` varchar(50) not null,
  `expiration` bigint(20),
  `exposure` int default 1 comment '1:public,2:unsearched,3,private',
  `state` int default 0 comment '0:useable,1:outday 2:delete',
  `extra_f` text,
  `created` bigint(20),
  `updated` bigint(20),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
''',
'''
ALTER TABLE `code_share` 
ADD UNIQUE INDEX `share_id_index` (`share_id` ASC);
''',
]
config = {}
config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqldb://root:111111@127.0.0.1:3306/jspass?charset=utf8'
config['SQLALCHEMY_POOL_SIZE'] = 3
config['SQLALCHEMY_POOL_MAX_OVERFLOW'] = 3



engine = create_engine(config['SQLALCHEMY_DATABASE_URI'],
                       pool_size=config['SQLALCHEMY_POOL_SIZE'],
                       max_overflow=config['SQLALCHEMY_POOL_MAX_OVERFLOW'])
session = scoped_session(sessionmaker(autocommit=False,
                                      autoflush=False,
                                      bind=engine))
metadata = MetaData(bind=engine)

from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base(metadata=metadata)
Base.query = session.query_property()

def init_tables(sqls):
    for sql in sqls:
        conn = engine.connect()
        try:
            conn.execute(sql)
        except:
            pass
        conn.close()

    
if __name__ == '__main__':
    init_tables(create_sqls)
    
#修改记录
modifylog=(
           
           )
