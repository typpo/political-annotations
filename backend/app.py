#!/usr/bin/env python
import json
import requests
from flask import Flask, jsonify, request
app = Flask(__name__)

@app.route("/")
def index():
  return "Hello World!"

@app.route("/legislature")
def people():
  r = requests.get('http://congress.api.sunlightfoundation.com/legislators?per_page=all&chamber=senate&apikey=dde4e99ca38e411abbc7d13af84ecbc0')
  obj = json.loads(r.text)
  returnObject = list()
  i = 0
  print obj['results']
  while(i < len(obj['results'])):
    fname = obj['results'][i]['first_name']
    lname = obj['results'][i]['last_name']
    mname = obj['results'][i]['middle_name']
    bioguide_id = obj['results'][i]['bioguide_id']
    temp = {'first_name':fname, 'last_name': lname, 'middle_name': mname, 'bioguide_id': bioguide_id}
    returnObject.append(temp)
    i += 1 
  results = {'results':returnObject}  
  return jsonify(results)

@app.route("/contribs")
def contribs():
  r = requests.get('')


if __name__ == "__main__":
  app.run(debug=True)
