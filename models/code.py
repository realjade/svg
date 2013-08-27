# -*- coding: utf-8 -*-
from models.base import buildmixin, Base
from flask import g
from sqlalchemy import Table, desc
from models import metadata, session


code = Table("code", metadata, autoload=True)
code_share = Table("code_share", metadata, autoload=True)


class Code(Base, buildmixin('extra')):
    __table__ = code
    
    def __str__(self):
        return self.code_id
    
class CodeShare(Base, buildmixin('extra')):
    __table__ = code_share
    
    def __str__(self):
        return self.id
    @property
    def code(self):
        from lib.functions import get_code
        code = get_code(self.code_id)
        from lib.datawrappers import wrap_code
        return wrap_code(code)