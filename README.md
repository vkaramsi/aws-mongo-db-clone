This an example on how to CRUD images and json files from Disk(your own SSD), this will replicate the behavior hosting services like AWS, Google Cloud, or Microsoft Cloud offer, to see an image go to https://localhost:5000/images/${nameofimage}${ext}.

To install dependencies
npm install

To run application
node index.js

or

nodemon index.js

To serve it to the internet use https://ngrok.com/, you will have to have your localhost server on, ngrok will create a tunnel and will give you a url for people to see it in the internet, you can pay ngrok $20 per month to have a custom url.

For example(your localhost host server will have to be running)

node index.js

./ngrok http 5000 --host-header=rewrite

Forwarding: https://f461-35-134-97-254.ngrok.io -> http://localhost:5000

To see image:
https://f461-35-134-97-254.ngrok.io/images/alexandra.jpeg

This is MIT's effort to decentralize cloud services and allow everyone that has a computer to have their own cloud service at home.

Website idea's that you can make with this software:
Youtube, Instagram, Facebook, Twitter, Google, AWS Buckets and Hosting Services, Microsoft Azure, Heroku, Netlify, Pinterest, Amazon, Netlifx, Hulu, Disney +, Blockbuster, RedBox Online, Spotify, Apple Music, Apple TV
