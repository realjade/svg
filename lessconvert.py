import os
import pyinotify
import shutil


class LessConvert(object):
    def __init__(self, app = None,manifest = 'LessConvert.manifest'):
        self.app = app
        self.wm = pyinotify.WatchManager()
        self.mask = pyinotify.IN_DELETE | pyinotify.IN_CREATE | pyinotify.IN_CLOSE_WRITE
        self.start()
        
    def start(self):
        handler = EventHandler(srcPath = self.app.root_path+'/static/less', dstPath= self.app.root_path+'/static/css')
        notifier = pyinotify.Notifier(self.wm, handler)
        self.wm.add_watch(self.app.root_path+'/static/less', self.mask, rec=True,auto_add=True )
        notifier.loop()

class EventHandler(pyinotify.ProcessEvent):
    def __init__(self, app = None,srcPath ='/static/less',dstPath='/static/css',manifest = 'LessConvert.manifest'):
        self.srcPath = srcPath
        self.dstPath = dstPath
        
    def process_IN_CREATE(self, event):
        print 'create a file:',event.pathname
        self.lessConvert(event)

    def process_IN_DELETE(self, event):
        print 'delete a file:',event.pathname
        self.deleteLess(event)

    def process_IN_CLOSE_WRITE(self, event):
        print 'modify a file:',event.pathname
        self.lessConvert(event)

    def lessConvert(self, event):
        ok,srcpath,dstpath = self.processPath(event.pathname)
        if ok:
            if srcpath and dstpath:
                os.system('lessc '+srcpath+' '+dstpath)
        else:
            os.mkdir(dstpath)
    
    def deleteLess(self,event):
        ok,srcpath,dstpath = self.processPath(event.pathname)
        print ok,srcpath,dstpath
        if ok:
            if dstpath:
                os.remove(dstpath)
        else:
            shutil.rmtree(dstpath)
        
    def processPath(self,path):
        pathname = path
        if pathname[-1] == '/':
            pathname = pathname[:-1]
        filepath = pathname.replace(self.srcPath,'')
        if os.path.isfile(pathname):
            if filepath[-4:] == 'less':
                srcpath = pathname
                dstpath =self.dstPath + filepath[:-4]+'css'
                return True,srcpath,dstpath
            else:
                return True,None,None
        else:
            srcpath = pathname
            if filepath[-4:] == 'less':
                dstpath =self.dstPath + filepath[:-4]+'css'
                return True,srcpath,dstpath
            else:
                dstpath =self.dstPath + filepath
                return False,srcpath,dstpath
        
from jspass import app
if app.config['USE_LESS']:
    lessconvert = LessConvert(app)
