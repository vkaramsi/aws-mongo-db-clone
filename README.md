This an example on how to write images to disk, read images, and delete images from Disk, this will replicate the behavior hosting services like AWS or Google Cloud offer, to see an image go to https://localhost:5000/images/${nameofimage}${ext}.

To install dependencies
npm install

To run application
node index.js

or

nodemon index.js

Date function

const today = new Date();
const thirtyDaySubscription = new Date(today);
thirtyDaySubscription.setDate(tomorrow.getDate() + 30);
thirtyDaySubscription.toLocaleDateString();
