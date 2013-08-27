# -*- coding: utf-8 -*-

# configuration
PER_PAGE = 30
DEBUG = True
SECRET_KEY = 'development key'
# 数据库连接配置
SQLALCHEMY_DATABASE_URI = 'mysql+mysqldb://root:111111@localhost:3306/jspass?charset=utf8'

# 数据库连接池最大连接数
SQLALCHEMY_POOL_SIZE = 45

# 数据库连接池最大允许过载数
SQLALCHEMY_POOL_MAX_OVERFLOW = 45

LOG_PATH = 'logs'

REDIS_HOST = '127.0.0.1'
REDIS_PORT = 6379
REDIS_DB   = 0
REDIS_PASSWORD = None

RECORD_ROOT = 'static/record/videos'
RECORD_HOST = '127.0.0.1:1935'

#邮件发送配置
SMTP_SENDER='noreply@beishu8.com'
SMTP_SERVER='smtp.exmail.qq.com'
SMTP_SENDER_PASSWORD = 'vself2012'
FROM_EMAIL='noreply@beishu8.com'
SENDER_NICKNAME=u'背书吧'