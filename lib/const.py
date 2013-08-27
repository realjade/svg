# -*- coding: utf-8 -*-

INVALID_GET = (2000,u'不支持GET方法')
INVALID_POST = (2001,u'不支持GPOST方法')
INVALID_PARAMS = (2002,u'参数不正确')
INVALID_PASSWORD = (2003,u'密码不正确')
INVALID_TWICEPASS = (2004,u'两次密码不一样')
INVALID_EMAIL = (2005,u'邮箱不合法')
INVALID_MOBILE = (2006,u'手机号不合法')

ACCOUNT_EXIST = (3000,u'该账户已经存在')
ACCOUNT_NOT_EXIST = (3001,u'该账户不存在')
ACCOUNT_EMAIL_EXIST = (3002,u'邮箱已经存在')

CLASSGRADE_EXIST = (4000,u'该班级已经存在')
CLASSGRADE_NOT_EXIST = (4001,u'该班级不存在')
SCHOOL_NOT_EXIST = (4002,u'学校不存在')

HANDIN_EXIST = (5000,u'该作业已经提交')
HANDIN_NOT_EXIST = (5001,u'没有该作业的提交信息')
HANDIN_NOT_YOURCHILD = (5002,u'不能给其他孩子交作业')
HANDIN_NOT_YOURS = (5002,u'你不能批改该作业')

HOMEWORK_EXIST = (6000,u'该作业已经存在')
HOMEWORK_NOT_EXIST = (6001,u'该作业不存在')
HOMEWORK_OUTDAY = (6002,u'该作业已过期')
HOMEWORK_HASAPPROVAL = (6003,u'该作业家长已经点评过')
HOMEWORK_HASCORRECT = (6003,u'该作业老师已经批改过')

VIDEO_NOT_SUPPORT = (7000,u'不支持的视频格式')
AVATAR_NOT_SUPPORT = (7001,u'不支持的图片格式')
VIDEO_NOT_EXIST = (7002,u'视频不存在')
VIDEO_CAN_NOT_REMOVE = (7003,u'视频已经在使用中，不能被删除')
VIDEO_UPLOAD_FAIL = (7004,u'视频上传失败')
UPLOAD_FAIL = (7005,u'上传失败')

APPROVAL_EXIST = (8000,u'该作业已经提交')
APPROVAL_NOT_EXIST = (8001,u'没有该作业的提交信息')
APPROVAL_NOT_YOURCHILD = (8002,u'不能给其他孩子审批')


RECORD_ID_NOT_EXISTS = (90001, u'record id not exists or record time too long')
RECORD_SAVE_ERROR = (90002, u'record save error')
