const express = require("express");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const stripe = require("stripe")(
  "sk_test_51JtaOHJYfPxdOrXDGjZctORM6JTfMXuBsoHYfbUJVu7EepMKdHggr1fXjKXbRTmFOCqdS37aBplF8HhA2qjxlXNz00GcK2sBr7"
);
const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);
const app = express();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./build/images");
  },
  filename: function (req, file, cb) {
    const fileName = path.parse(file.originalname).ext;

    cb(null, req.params.userName + req.params.picNumber + fileName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

//The five at the end represents megabytes.
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

app.use(express.static("build"));

app.use(cors());
app.use(bodyParser.json());
const YOUR_DOMAIN = "http://localhost:5000";

app.post("/send-email", async (req, res) => {
  try {
    await transporter.sendMail({
      to: "hm@gmail.com",
      from: "hm@gmail.com",
      subject: "Signup Succeeded",
      html: "<h1>Hello world</h1>",
    });
  } catch (e) {
    throw new Error(e);
  }
});
app.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (e.g. pr_1234) of the product you want to sell
        price: "price_1JtaTVJYfPxdOrXDLUMksGtI",
        quantity: 1,
      },
    ],
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${YOUR_DOMAIN}/success.html`,
    cancel_url: "https://dashboardsapp.herokuapp.com/#/",
  });

  res.redirect(303, session.url);
});

app.post("/charge-card", async (req, res) => {
  const { payment_number, exp_month, exp_year, cvc, email } = req.body.params;

  try {
    const token = await stripe.tokens.create({
      card: {
        number: payment_number,
        exp_month,
        exp_year,
        cvc,
      },
    });

    const charge = await stripe.charges.create({
      amount: 4000,
      currency: "usd",
      source: token.id,
      description: "Dashboards monthly pay as you go subscription.",
      receipt_email: email,
    });

    res.send(charge);
  } catch (e) {
    res.status(400).send("Credit Card Declined");
    throw new Error(e);
  }
});

app.get("/get-users", (req, res) => {
  const rawdata = fs.readFileSync("./database/users.json");
  const jsondata = JSON.parse(rawdata);

  res.send(jsondata);
});

app.post("/create-route/:routeName", (req, res) => {
  const rawdata = fs.readFileSync("./database/routes.json");
  const jsonData = JSON.parse(rawdata);
  const { routeName } = req.params;
  jsonData["routes"].push(routeName);
  const jsonToWrite = JSON.stringify(jsonData);
  fs.writeFileSync("./database/routes.json", jsonToWrite);
  res.send("It's alive!");
});

app.post("/create-user/:email/:username/:lastFourCard", (req, res) => {
  const rawdata = fs.readFileSync("./database/users.json");
  const jsondata = JSON.parse(rawdata);
  const today = new Date();
  const thirtyDaySubscription = new Date(today);
  thirtyDaySubscription.setDate(thirtyDaySubscription.getDate() + 30);
  thirtyDaySubscription.toLocaleDateString();

  const { email, username, lastFourCard } = req.params;
  jsondata[username] = {
    email,
    username,
    lastFourCard,
    paidSubscription: "Y",
    published: "N",
    dateOfPurchase: today.toLocaleDateString(),
    dateOfExpiration: thirtyDaySubscription.toLocaleDateString(),
    userProducts: [
      {
        image: "",
        imageName: "",
        titleOfProduct: "",
        priceOfProduct: "",
      },
      {
        image: "",
        imageName: "",
        titleOfProduct: "",
        priceOfProduct: "",
      },
      {
        image: "",
        imageName: "",
        titleOfProduct: "",
        priceOfProduct: "",
      },
      {
        image: "",
        imageName: "",
        titleOfProduct: "",
        priceOfProduct: "",
      },
      {
        image: "",
        imageName: "",
        titleOfProduct: "",
        priceOfProduct: "",
      },
      {
        image: "",
        imageName: "",
        titleOfProduct: "",
        priceOfProduct: "",
      },
    ],
  };
  const jsonData = JSON.stringify(jsondata);
  fs.writeFileSync("./database/users.json", jsonData);
  res.send("Success!");
});

app.post("/upload/:userName/:picNumber", upload.single("file"), (req, res) => {
  if (req.file) {
    res.json(req.file);
  } else throw "error";
});

app.delete("/upload/:userName/:picNumber/:ext", (req, res) => {
  const fileName =
    req.params.userName + req.params.picNumber + "." + req.params.ext;

  try {
    fs.unlinkSync(`build/images/${fileName}`);

    res.status(201).send({ message: "Image deleted" });
  } catch (e) {
    res.status(400).send({
      message: "Error deleting image!",
      error: e.toString(),
      req: req.body,
    });
  }
});

//This creates a worker for every CPU, this allows the server to be ranned in a multi-thread manner, meaning you can use every
//core in your machine to serve your application, this will make your server faster.

if (cluster.isMaster) {
  for (var i = 0; i < numCPUs; i++) {
    // Create a worker
    cluster.fork();
  }
} else {
  app.listen(process.env.PORT || 5000, () => {
    console.log("listenting");
  });
}
