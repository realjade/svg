# -*- coding: utf-8 -*-

from flask import Flask, g, session,url_for
from datetime import datetime
from hashlib import md5
#from redis import Redis
#from rsession import RedisSessionInterface
import types
import config
from assets import Assets

from flask import Flask
app = Flask("webgl")
app.config.from_object(config)
#第一期不需要redis
#app.redis = Redis(app.config['REDIS_HOST'], app.config['REDIS_PORT'], app.config['REDIS_DB'], app.config['REDIS_PASSWORD'])
#app.session_interface = RedisSessionInterface(app.redis)

#先不连接数据库
#import models
#models.setup(app)

assets = Assets(app)

from views import main

app.register_blueprint(main.module)

from lib import filters
filters.setup(app)

from flask import render_template
from flask import request

@app.errorhandler(404)
def page_not_found(error):
    if request.path.startswith('/static/'):
        return error, 404
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_internal_error(error):
    import traceback
    app.logger.error('='*60)
    app.logger.error(traceback.format_exc())
    app.logger.error('='*60)
    return render_template('500.html')
        
# 设置logger的输出形式
import logging, os 
from logging.handlers import TimedRotatingFileHandler 
#base = os.path.abspath(os.path.dirname(__file__)) 
log_root = app.config.get('LOG_PATH', 'logs')
logfile = os.path.join(os.path.abspath(log_root), 'webgl.log') 
handler = TimedRotatingFileHandler(filename=logfile, when='MIDNIGHT', interval=1, backupCount=14) 
handler.setFormatter(logging.Formatter('%(asctime)s  %(levelname)-8s %(message)s')) 
handler.setLevel(logging.DEBUG) 
app.logger.addHandler(handler) 
app.logger.setLevel(logging.DEBUG if app.debug else logging.INFO) 

#from models.user import User
#from lib import functions as f

#@app.before_request
#def before_request():
    #"""Make sure we are connected to the database each request and look
    #up the current user so that we know he's there.
    #"""
    #g.redis = app.redis
    #g.user = None


#@app.teardown_request
#def teardown_request(exception):
    #"""Closes the database again at the end of the request."""
    #models.session.rollback()
    #models.session.close()

@app.template_filter()
def staticurl(s):
    return assets.versionify(s)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=7777,threaded=True)