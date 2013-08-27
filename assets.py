# -*- coding: utf-8 *-*

import os
import hashlib
import json

app_path = os.path.dirname(os.path.abspath(__file__))

class Assets(object):
    def __init__(self, app = None, manifest = 'assets.manifest'):
        self.app = app
        self.manifest = os.path.join(app_path, manifest)
        self.cache = {}
        try:
            self.load_manifest()
        except:
            pass
        if self.app:
            self.app.jinja_env.filters['versionify'] = self.versionify
    
    def versionify(self, url_path):
        fpath = app_path + url_path
        if not self.valid_asset(fpath):
            return url_path
        if url_path not in self.cache:
            try:
                self.build_asset(fpath)
            except:
                pass
        if url_path in self.cache:
            return '%s?%s'%(url_path, self.cache[url_path][0:10])
        return url_path
    
    
    def build_assets_cache(self, adir = 'static', prefix=''):
        rootdir = os.path.join(app_path, adir)
        for root, dirs, files in os.walk(rootdir):
            for f in files:
                fpath = os.path.join(root, f)
                self.build_asset(fpath)
                    
    def build_asset(self, fpath):
        if self.valid_asset(fpath):
            url_path = fpath[len(app_path):]
            self.cache[url_path] = self.generate_version(fpath)
        
    def load_manifest(self):
        with open(self.manifest, 'rb') as f:
            self.cache = json.loads(f.read())
                      
    def save_manifest(self):
        with open(self.manifest, 'wb') as f:
            f.write(json.dumps(self.cache))
    
    def valid_asset(self, fpath):
        return os.path.splitext(fpath)[1] in ['.css', '.js', '.swf']
            
    def generate_version(self, fpath):
        with open(fpath, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()


if __name__ == '__main__':
    a = Assets()
    a.build_assets_cache('static')
    a.save_manifest()
 