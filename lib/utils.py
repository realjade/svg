# -*- coding: utf-8 *-*
from random import choice
import string
import re
from math import ceil
import os
import Image

def create_user_id():
    return '1' + ''.join([choice(string.digits) for i in range(0, 9)])

def create_admin_id():
    return '2' + ''.join([choice(string.digits) for i in range(0,9)])

def create_code_id():
    return '3' + ''.join([choice(string.digits + string.letters) for i in range(0, 12)])

def create_codeshare_id():
    return '4' + ''.join([choice(string.digits + string.letters) for i in range(0, 12)])

def create_school_id():
    return '5' + ''.join([choice(string.digits) for i in range(0,9)])

def create_video_id():
    return '6' + ''.join([choice(string.digits + string.letters) for i in range(0, 12)])

def create_works_id():
    return '7' + ''.join([choice(string.digits + string.letters) for i in range(0, 12)])

def create_annotator_id():
    return '8' + ''.join([choice(string.digits + string.letters) for i in range(0, 12)])

def random_filename():
    return ''.join([choice(string.letters) for i in range(0, 12)])

def getDefault(val, default = None):
    if not val:
        return default
    return val

def is_email(email):
    if not email:
        return False
    p = re.compile("\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*")
    return p.match(email) != None

def is_mobile(phone):
    if not phone :
        return False
    p = re.compile("^(1(3|5|8))\d{9}$")
    return p.match(phone) != None


htmlCodes = [
    ['&', '&amp;'],
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['"', '&quot;'],
]

htmlCodesReversed = htmlCodes[:]
htmlCodesReversed.reverse()

def html_decode(s, codes=htmlCodesReversed):
    """ Returns the ASCII decoded version of the given HTML string. This does
        NOT remove normal HTML tags like <p>. It is the inverse of htmlEncode()."""
    for code in codes:
        s = s.replace(code[1], code[0])
    return s

def html_encode(s, codes=htmlCodes):
    """ Returns the HTML encoded version of the given string. This is useful to
        display a plain ASCII text string on a web page."""
    for code in codes:
        s = s.replace(code[0], code[1])
    return s

from flask import current_app, g

def create_avatar(filestream):
    app = current_app
    destpath = '/tmp/%s/avatars/'%(app.name)
    if not os.path.exists(destpath):
        os.makedirs(destpath)
    ext = os.path.splitext(filestream.filename)[1]
    filename = ''.join([choice(string.digits) for i in range(0, 11)])
    savepath = os.path.join(destpath, '%s%s'%(filename, ext))
    filestream.save(savepath)
    img = Image.open(savepath)
    box = img.getbbox()
    width = box[2]
    height = box[3]
    
    startx = 0 if height >= width else (width - height)/2
    endx = width if height >= width else (height + width)/2

    starty = 0 if width >= height else (height - width)/2
    endy = height if width >= height else (width + height)/2

    newbox = (startx,starty,endx,endy)

    user_id = g.user.user_id
    avatarfolder = 'avatars/%s/%s/%s'%(user_id[0:3], user_id[3:6], user_id[6:])
    fullpath = os.path.join(app.static_folder, avatarfolder)
    print fullpath
    if not os.path.exists(fullpath):
        os.makedirs(fullpath)
    for w in [50, 100, 150]:
        newimg = img.crop(newbox)
        newimg.thumbnail((w,w), Image.ANTIALIAS)
        newimg.save(os.path.join(fullpath, '%d.jpg'%(w)), 'JPEG', quality=90)
    os.remove(savepath)
    return '%s/%s'%(app.static_url_path, avatarfolder)

class Pagination(object):

    def __init__(self, page, per_page, total_count):
        self.page = page
        self.per_page = per_page
        self.total_count = total_count

    @property
    def pages(self):
        return int(ceil(self.total_count / float(self.per_page)))

    @property
    def has_prev(self):
        return self.page > 1

    @property
    def has_next(self):
        return self.page < self.pages

    def iter_pages(self, left_edge=2, left_current=2,
                   right_current=5, right_edge=2):
        last = 0
        for num in xrange(1, self.pages + 1):
            if num <= left_edge or \
               (num > self.page - left_current - 1 and \
                num < self.page + right_current) or \
               num > self.pages - right_edge:
                if last + 1 != num:
                    yield None
                yield num
                last = num
