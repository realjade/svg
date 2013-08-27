# -*- coding: utf-8 -*-
import os
import utils as ut
from flask import json, g
import models as m
from models.user import User
from models.code import Code, CodeShare
import time
from datetime import datetime
import types
import lib.filters as ft

def wrap_user(data,extra={}):
    if not data:
        return None
    tag,data = wrapList(data)
    result = map(lambda x:{
                        'user_id':x.user_id,
                        'smallavatar': ft.avatar(x),
                        'mediumavatar': ft.avatar(x,'medium'),
                        'bigavatar': ft.avatar(x,'big'),
                        'nickname':x.nickname,
                        'email':x.email,
                        'username':x.username
                        },data)
    return result if tag else result[0]

def wrap_code(data,extra={}):
    if not data:
        return {}
    tag,data = wrapList(data)
    result = map(lambda x:{
                          'code_id':x.code_id,
                          'content':x.content,
                          'created':ft.format_datetime(x.created),
                          'updated':ft.format_datetime(x.updated),
                           },data)
    return result if tag else result[0]

def wrap_codeshare(data,extra={}):
    if not data:
        return {}
    tag,data = wrapList(data)
    result = map(lambda x:{
                          'code_id':x.code_id,
                          'share_id':x.share_id,
                          'title':x.title,
                          'language':x.language,
                          'exposure':x.exposure,
                          'state':x.state,
                          'created':ft.format_datetime(x.created),
                          'updated':ft.format_datetime(x.updated),
                          'code':x.code if extra.get('code',None) == True else ''
                           },data)
    return result if tag else result[0]

def wrapList(data):
    if type(data) not in [types.ListType,types.TupleType]:
        result = (False,[data,])
    else:
        result = (True,data)
    return result