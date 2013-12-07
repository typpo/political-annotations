#!/usr/bin/env python
import json
import requests
from flask import Flask, jsonify, request
app = Flask(__name__)


freebase_apikey = 'AIzaSyBrVttmcZFdJIRntbpm6WTI_QzCm3Vpi04'

@app.route("/")
def index():
  return "Hello World!"

def adjust_first_name(name):
  if name == 'Charles':
    return 'Chuck'
  return name

@app.route("/legislature")
def people():
  r = requests.get('http://congress.api.sunlightfoundation.com/legislators?per_page=all&chamber=senate&apikey=dde4e99ca38e411abbc7d13af84ecbc0')
  obj = json.loads(r.text)
  returnObject = []
  for person in obj['results']:
    temp = {
        'first_name': adjust_first_name(person['first_name']),
        'last_name': person['last_name'],
        'middle_name': person['middle_name'],
        'bioguide_id': person['bioguide_id']
        }
    returnObject.append(temp)
  return jsonify({'results':returnObject})

@app.route('/person')
def person():
  d = contact()
  p = contribs()
  return 

@app.route('/contact')
def contact():
  id = request.args.get('id', None)
  print id
  r = requests.get('http://congress.api.sunlightfoundation.com/legislators?bioguide_id=%s&apikey=dde4e99ca38e411abbc7d13af84ecbc0' % id)
  data = json.loads(r.text)
  return jsonify({'results':data['results']})

@app.route('/contribs')
def contribs():
  name = request.args.get('name', None)
  # bio id does not work for cory booker
  #r = requests.get('http://congress.api.sunlightfoundation.com/legislators?chamber=senate&bioguide_id=%s&apikey=dde4e99ca38e411abbc7d13af84ecbc0' % bio)
  r = requests.get('http://transparencydata.com/api/1.0/entities.json?apikey=dde4e99ca38e411abbc7d13af84ecbc0&search=%s&type=politician' % (name.replace(' ', '+')))
  entities = json.loads(r.text)
  if len(entities) < 1:
    print entities
    return jsonify({'success': False})
  entity_id = entities[0]['id']

  url = 'http://transparencydata.com/api/1.0/aggregates/pol/%s/contributors.json?limit=10000&apikey=dde4e99ca38e411abbc7d13af84ecbc0' % entity_id
  r = requests.get(url)
  contributors = json.loads(r.text)

  ret = []
  for contrib in contributors:
    ret.append({
      'direct_amount': int(float(contrib['direct_amount'])),
      'employee_amount': int(float(contrib['employee_amount'])),
      'total_amount': int(float(contrib['total_amount'])),
      'name': contrib['name'],
      })

  return jsonify({
    'results': sorted(ret[:5], key=lambda x: x['total_amount'], reverse=True)
    })

  r = requests.get('http://transparencydata.com/api/1.0/aggregates/pol/4148b26f6f1c437cb50ea9ca4699417a/contributors.json?cycle=2012&limit=100&apikey=dde4e99ca38e411abbc7d13af84ecbc0')

  obj = json.loads(r.text)

  return r.text

if __name__ == "__main__":
  app.run(debug=True)