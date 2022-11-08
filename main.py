from flask import Flask, jsonify, render_template, request
from flask_restful import Resource, Api
import requests
from bs4 import BeautifulSoup

app = Flask(__name__,static_folder="static")
api = Api(app)

@app.route('/')
def index():
    return render_template("index.html")

# class Square(Resource):
#     def get(self, num):
#         return jsonify({'data': num**2})
  
# api.add_resource(Square, '/square/<int:num>'


if __name__ == '__main__':
    app.run(debug = True)