#!/usr/bin/env python3

import cgitb, json
from jinja2 import Template, Environment, FileSystemLoader

from settings import settings

cgitb.enable()

loader = FileSystemLoader(['./ui', './resources'])
env = Environment(loader=loader)
template = env.get_template('base.html')


with open('./resources/themes.json') as f:
	themes = json.load(f)



rendered = template.render(dev=settings['dev'], theme=themes['Deep Dark']);


print("Content-type: text/html\n")
print(rendered)

with open('index.html', 'w') as f:
	f.write(rendered)


