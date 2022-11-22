from flask import Flask, jsonify, render_template, request
from flask_restful import Resource, Api
from pygooglenews import GoogleNews
from geopy.geocoders import Nominatim
import pycountry

geolocate=Nominatim(user_agent="getloc")
googleNews=GoogleNews(lang='en')
countries=list(pycountry.countries)
lenght=len(countries)
newsfeed=list()

def fetch(country):
    news=googleNews.geo_headlines(country)
    try:
        location=geolocate.geocode(country.name)
        newsfeed.append({'country':country.name,'feed':news['entries'],'coords':[location.latitude,location.longitude]})
    except:
         print("couldnotwork")


        
app = Flask(__name__,static_folder="static")
api = Api(app)

@app.route('/')
def index():
    print(newsfeed)
    return render_template("index.html")

# class Square(Resource):
#     def get(self, num):
#         return jsonify({'data': num**2})
  
# api.add_resource(Square, '/square/<int:num>'


if __name__ == '__main__':
    app.run(debug = True)
    count=0
    while True:
        print(count)
        fetch(countries[count])
        count+=1
        count%=lenght