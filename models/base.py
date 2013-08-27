# -*- coding: utf-8 -*-
# -*- coding: utf-8 -*-
import pickle
from werkzeug.datastructures import CallbackDict
import types
from models import metadata, session
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base(metadata=metadata)
Base.query = session.query_property()

def buildmixin(proplist):
    if type(proplist) in types.StringTypes:
        proplist = [proplist]
    namelist = map(lambda x: x.capitalize(), proplist)
    cls = type('Pickle'+''.join(namelist)+'Mixin', (object, ), {})
    def add_propfunc(self, prop):
        def propfunc(self):
            _prop = '_'+prop
            prop_f = prop+'_f'
            if hasattr(self, _prop):
                return getattr(self, _prop)

            def on_update(cd):
                setattr(self, prop_f, pickle.dumps(dict(cd)))
            d = {}
            try:
                d = pickle.loads(getattr(self, prop_f))
            except:
                pass
            setattr(self, _prop, CallbackDict(d, on_update=on_update))
            return getattr(self, _prop)
        
        propfunc.__name__ = prop
        setattr(cls,propfunc.__name__,property(propfunc))
    for prop in proplist:
        add_propfunc(cls, prop)
    return cls
