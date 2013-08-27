# -*- coding: utf-8 *-*
from sqlalchemy import Table
from sqlalchemy.ext.declarative import declarative_base
from models import metadata, session
from werkzeug.datastructures import CallbackDict
import types
import json
import time

user = Table("user", metadata, autoload=True)
code = Table("code", metadata, autoload=True)
code_share = Table("code_share", metadata, autoload=True)

Base = declarative_base(metadata=metadata)
Base.query = session.query_property()

class User(Base):
    __table__ = user
    
    def __str__(self):
        return self.user_id
    
    @property
    def extra(self):
        if hasattr(self, '_extra_f'):
            return self._extra_f
        def on_update(d):
            try:
                self.extra_f = json.dumps(d)
            except:
                pass
        _extra_fdict = {}
        try:
            _extra_fdict = json.loads(self.extra_f)
        except:
            pass
        self._extra_f = CallbackDict(_extra_fdict, on_update = on_update)
        return self._extra_f
    
class Code(Base):
    __table__ = code
    
    def __str__(self):
        return self.code_id
    
    @property
    def extra(self):
        if hasattr(self, '_extra_f'):
            return self._extra_f
        def on_update(d):
            try:
                self.extra_f = json.dumps(d)
            except:
                pass
        _extra_fdict = {}
        try:
            _extra_fdict = json.loads(self.extra_f)
        except:
            pass
        self._extra_f = CallbackDict(_extra_fdict, on_update = on_update)
        return self._extra_f
    
class CodeShare(Base):
    __table__ = code_share
    
    def __str__(self):
        return self.id
    @property
    def code(self):
        from lib.functions import get_code
        code = get_code(self.code_id)
        from lib.datawrappers import wrap_code
        return wrap_code(code)
    
    @property
    def extra(self):
        if hasattr(self, '_extra_f'):
            return self._extra_f
        def on_update(d):
            try:
                self.extra_f = json.dumps(d)
            except:
                pass
        _extra_fdict = {}
        try:
            _extra_fdict = json.loads(self.extra_f)
        except:
            pass
        self._extra_f = CallbackDict(_extra_fdict, on_update = on_update)
        return self._extra_f