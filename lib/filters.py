# -*- coding: utf-8 -*-
from datetime import datetime
import time
import types
import pystache
from flask import current_app, json
from jinja2 import evalcontextfilter, Markup, contextfunction, Environment
import os

def format_datetime(value, format=None):
    result = None
    if not value:
        return ''
    if format == 'full':
        fmt=u"%Y年%m月%d日, %H:%M:%S"
    elif format == 'medium':
        fmt=u"%m月%d日%H:%M"
    else:
        fmt=u"%Y-%m-%d"
    if format:
        if type(value) in [types.IntType, types.LongType, types.FloatType]:
            value = datetime.fromtimestamp(int(value)/1000)
            result = value.strftime(fmt.encode('utf-8')).decode('utf-8')
    else:
        result = int(time.time()) - int(value/1000)
        if result<60:
            result = str(result)+u'秒前'
        elif result<60*60:
            result = str(int(result/60)) + u'分前'
        elif result<60*60*24:
            result = str(int(result/60/60)) + u'小时前'
        else:
            if type(value) in [types.IntType, types.LongType, types.FloatType]:
                value = datetime.fromtimestamp(int(value)/1000)
                result = value.strftime(fmt.encode('utf-8')).decode('utf-8')
    return result


def slist(data):
    if type(data) not in [types.ListType, types.TupleType]:
        return [data]
    else:
        return data


def ifdefault(value,expression,default = ''):
    return value if expression else default


@contextfunction
def render_mustache(context, template_path, **kwargs):
    env = Environment(loader=context.environment.loader, trim_blocks=True)
    env.variable_start_string = '{{{{'
    env.variable_end_string = '}}}}'
    env.comment_start_string = '{{{#'
    env.comment_end_string = '#}}}'
    #loader = env.loader
    #template, filename, uptodate= loader.get_source(env, template_path)
    template_context = dict(context.get_all())
    template_context.update(**kwargs)
    template = env.get_template(template_path, globals=template_context)
    template = template.render()
    view = dict(context.get_all())
    view.update(**kwargs)
    result = pystache.render(template, view)
    if context.eval_ctx.autoescape:
        result = Markup(result)
    return result


@contextfunction
def include_mustache(context, template_path, scriptag=True, **kwargs):
    env = Environment(loader=context.environment.loader, trim_blocks=True)
    env.variable_start_string = '{{{{'
    env.variable_end_string = '}}}}'
    env.comment_start_string = '{{{#'
    env.comment_end_string = '#}}}'
    #loader = env.loader
    #template, filename, uptodate= loader.get_source(env, template_path)
    template_context = dict(context.get_all())
    template_context.update(**kwargs)
    template = env.get_template(template_path, globals=template_context)
    template = template.render()
    stagid = os.path.splitext(template_path)[0].replace('/', '_')
    if scriptag:
        template = '<script id="%s" class="mustache-template" type="text/template">\n%s\n</script>'%(stagid, template)
    if context.eval_ctx.autoescape:
        template = Markup(template)
    return template


@contextfunction
def get_context(context):
    return context


def avatar(user, size='small'):
    if not user.avatar:
        return '/static/images/icons/avatar.jpg'
    fname = '50.jpg'
    if size == 'medium':
        fname = '100.jpg'
    if size == 'big':
        fname = '150.jpg'
    return '%s/%s'%(user.avatar, fname)


def setup(app):
    app.jinja_env.filters['datetime'] = format_datetime
    app.jinja_env.filters['slist'] = slist
    app.jinja_env.filters['ifdefault'] = ifdefault
    app.jinja_env.globals['render_mustache'] = render_mustache
    app.jinja_env.globals['include_mustache'] = include_mustache
    app.jinja_env.globals['context'] = get_context
    app.jinja_env.filters['avatar'] = avatar
