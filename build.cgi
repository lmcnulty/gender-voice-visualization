#!/usr/bin/env python3

import cgitb
from jinja2 import Template, Environment, FileSystemLoader

cgitb.enable()

loader = FileSystemLoader(['./ui', './resources'])
env = Environment(loader=loader)
template = env.get_template('base.html')
rendered = template.render(dev=False) 

print("Content-type: text/html\n")
print(rendered)

with open('index.html', 'w') as f:
	f.write(rendered)


