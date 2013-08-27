# -*- coding: utf-8 -*-

import os
import utils as ut
from flask import json, g, request, session
import models as m
from models.user import *
from models.code import *
from sqlalchemy import or_, func, distinct
from sqlalchemy import desc, asc
from sqlalchemy.orm import aliased
import time
from datetime import datetime
import types
import lib.filters as ft
import math


def succeed(data):
    return json.dumps({"code":'0', "data":data})

def failed(code, message):
    return json.dumps({"code":code, "message":message})

def load_codeshares(limit=10,filter = 'public'):
    if filter == 'public':
        return m.session.query(CodeShare).filter(CodeShare.exposure == 1).order_by(desc(CodeShare.created)).limit(limit).all()
    return m.session.query(CodeShare).order_by(desc(CodeShare.created)).limit(limit).all()

def get_user(username):
    """Convenience method to look up the id for a username."""
    if not username:
        return None
    return m.session.query(User).filter(or_(User.email == username,User.username == username)).first()

def get_code(code_id):
    if not code_id:
        return None
    return m.session.query(Code).filter(Code.code_id == code_id).first()

def get_codeshare(share_id):
    if not share_id:
        return None
    return m.session.query(CodeShare,Code).filter(CodeShare.share_id == share_id)\
                    .join(Code,Code.code_id == CodeShare.code_id).first()