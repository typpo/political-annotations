#!/usr/bin/env python
import json
import requests
from flask import Flask, jsonify
app = Flask(__name__)

@app.route("/")
def index():
  return "Hello World!"

@app.route("/legislature")
def people():
  r = requests.get('http://congress.api.sunlightfoundation.com/legislators?chamber=senate&apikey=dde4e99ca38e411abbc7d13af84ecbc0')
  obj = json.loads(r.text)
  returnObject = list()
  i = 0
  while(i < len(obj)):
    fname = obj['results'][i]['first_name']
    lname = obj['results'][i]['last_name']
    mname = obj['results'][i]['middle_name']
    bioguide_id = obj['results'][i]['bioguide_id']
    temp = {'first_name':fname, 'last_name': lname, 'middle_name': mname, 'bioguide_id': bioguide_id}
    returnObject.append(temp)
    i += 1 
  results = {'results':returnObject}  
  return jsonify(results)

  #JSON decode into list = total list of senators
  #temp JSON or list = return
  #while(len(list) != 0)
    #fname = first name index at pos
    #lname = last name index at pos
    #mname = middle name index at pos
    #bioguide_id = index at pos
    #create a new list or new JSON of first name, last name, mname, id
    #temp push to return array or JSON
  #return or echo return

if __name__ == "__main__":
  app.run(debug=True)
