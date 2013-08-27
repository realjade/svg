#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
将 vself 以 FastCGI Server 的方式运行。

基于 flup 构建。每个 fcgi 服务器采用多线程的方式运行。当然，为了发挥多 CPU
核心的能力，可以启动多个这样的 fcgi 服务器。

"""
js
import os,sys
import argparse
import logging
from flup.server.fcgi import WSGIServer
from lib.daemon import Daemon
from webgl import app


APP_NAME = 'webgl'
APP_INST_NAME = '20130706'

# 命令行参数
parser = argparse.ArgumentParser(description=u'Run an webgl FastCGI server')
parser.add_argument('command', type=str,
                    help=u'command [start|stop|restart]',
                    choices=['start', 'stop', 'restart'])
parser.add_argument('-p', '--port', type=int,
                    help=u'port of this server', required=True)
parser.add_argument('-t', '--threads', type=int, default=500,
                    help=u'max number of threads')

class WebglDaemon(Daemon):
    def run(self):
        # 运行服务
        try:
            WSGIServer(
                app,
                bindAddress=('0.0.0.0', args.port),
                maxThreads=args.threads,
                umask=0111
            ).run()
        except:
            sys.stderr.write('oops')
            
def gen_pidfile(port):
    return '/tmp/%s_%s_%d.pid'%( APP_NAME, APP_INST_NAME, port)

if __name__ == '__main__':
    args = parser.parse_args()
    daemon = WebglDaemon(gen_pidfile(args.port))
    if 'start' == args.command:
        daemon.start()
    elif 'stop' == args.command:
        daemon.stop()
    elif 'restart' == args.command:
        daemon.restart()
    else:
        print "Unknown command"
        sys.exit(2)
    sys.exit(0)
    