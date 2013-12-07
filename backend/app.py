#!/usr/bin/env python
import requests
from flask import Flask, jsonify
app = Flask(__name__)

@app.route("/")
def index():
  return "Hello World!"

@app.route("/people")
def people():
  r = requests.get('http://congress.api.sunlightfoundation.com/legislators?chamber=senate&apikey=dde4e99ca38e411abbc7d13af84ecbc0')
  return jsonify(r.text)

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
