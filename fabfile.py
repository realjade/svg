# -*- coding: utf-8 -*-
#!/usr/bin/python
import os
from fabric.api import hosts, run, env, local, cd, get, lcd

env.hosts = ["vself@42.121.65.179"]
env.passwords = {"vself@42.121.65.179":"vself2045"}
# 179  v.beishu8.com
# 234  beishu8.com

############v.beishu8.com#############
@hosts("vself@42.121.65.179")
def update():
    """更新jspass.com代码"""
    with cd("/home/vself/services/jspass"):
        run("hg pull")
        run("hg update -C")


@hosts("vself@42.121.65.179")
def restart():
    """重启jspass.com服务"""
    with cd("/home/vself/services/jspass"):
        run("python jspass.fcgi -t 20 -p 7777 restart")
        run("python jspass.fcgi -t 20 -p 7778 restart")

def deploy():
    update()
    restart()
