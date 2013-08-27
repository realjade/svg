# -*- coding: utf-8 -*-

from functools import wraps
from flask import request, g, session, redirect, url_for, current_app
import models as m
from models.user import User

def admin_required(fn):
    @wraps(fn)
    def admin_wrapped(*argt, **argd):
        from lib.functions import load_admin
        admin = None
        if g.user:
            admin = load_admin(g.user.user_id)
        if not g.user or not admin:
            return redirect(url_for('main.login',next = request.url))
        ret = fn(*argt, **argd)
        return ret
    return admin_wrapped

def login_required(fn):
    @wraps(fn)
    def login_wrapped(*argt, **argd):
        if g.user is None:
            return redirect(url_for('main.login', next=request.url))
        ret = fn(*argt, **argd)
        return ret
    return login_wrapped

def load_user(fn):
    @wraps(fn)
    def load_user_wrapped(*argt, **argd):
        user = None
        if session and session.sid and 'user_id' in session:
            user = m.session.query(User).filter(User.user_id == session['user_id']).first()
        g.user = user
        ret = fn(*argt, **argd)
        return ret
    return load_user_wrapped
