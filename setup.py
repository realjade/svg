# -*- coding: utf-8 -*-
from setuptools import setup, find_packages

'''
    Run in shell: 
        
        python setup.py develop 
'''

setup(
    name='Tongbupan User Platform',
    version='1.0',
    long_description=__doc__,
    packages= find_packages(exclude=['tests']), #['deploy', 'views', 'lib', 'models', 'scripts'],
    include_package_data=True,
    exclude_package_data = { '': ['config.py'] },
    zip_safe=False,
    test_suite='tests',
    install_requires=[
                      'Flask',
                      'SQLAlchemy',
                      'MySQL-python',
                      'simplejson',
                      'flup',
                      'redis',
                      'captchaimage',
                      'pystache',
                      'Flask-Cache',
                      'pil'
                      ]
)