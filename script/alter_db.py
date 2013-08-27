#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
目地：用于处理对数据结构的修改
使用方法:
    1.在当前文件夹新建xxx.py文件
    2.导入from alter_db import alter_tables
    3.创建create_sqls = ['sql命令列表',] 传入alter_tables函数
"""
from sqlalchemy import *
from sqlalchemy.orm import scoped_session, sessionmaker

__all__ = ["alter_tables",]

config = {}
config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqldb://root:111111@127.0.0.1:3306/jsparse?charset=utf8'
#config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqldb://vself:vself2012@42.121.65.179:3306/vself?charset=utf8'
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

def alter_tables(sqls):
    for sql in sqls:
        conn = engine.connect()
        try:
            conn.execute(sql)
        except Exception,e:
            print "errorsql:%s" % sql
            print e
        conn.close()

