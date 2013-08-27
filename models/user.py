# -*- coding: utf-8 -*-
from models.base import buildmixin, Base
from flask import g
from sqlalchemy import Table, desc
from models import metadata, session


user = Table("user", metadata, autoload=True) # 任务记录 附件在extra内


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