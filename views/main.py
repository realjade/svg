# -*- coding: utf-8 -*-
from flask import Blueprint
from flask import request, session, url_for, redirect, \
        render_template, abort, g, flash, json, Response, make_response, current_app,send_file
from lib import const
from lib import functions as f
import os
import string
import types
from random import choice

# Flask 模块对象
module = Blueprint('main', __name__)


@module.route('/')
def index():
    return render_template('index.html', tab = 'index')

@module.route('/test/')
def test():
    return render_template('test.html', tab = 'test')

@module.route('/glodon/')
def glodon():
    return render_template('glodon/glodon.html', tab = 'glodon')

@module.route('/glodon/svg/')
def glodon_svg():
    return render_template('glodon/svg.html', tab = 'glodon')

@module.route('/glodon/svg/prop/',methods=['GET','POST'])
def glodon_svg_prop():
    geom_id = request.values.get('geom_id',None)
    return f.succeed({'geom_id':geom_id,'random':''.join([choice(string.digits) for i in range(0,9)])})

@module.route('/glodon/test/')
def glodon_test():
    return render_template('HelloGL.html', tab = 'glodon')
