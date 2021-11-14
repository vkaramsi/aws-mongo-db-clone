const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const stripe = require("stripe")(
  "sk_test_51JtaOHJYfPxdOrXDGjZctORM6JTfMXuBsoHYfbUJVu7EepMKdHggr1fXjKXbRTmFOCqdS37aBplF8HhA2qjxlXNz00GcK2sBr7"
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

app.listen(process.env.PORT || 5000, () => {
  console.log("listenting");
});

app.get("/get-users", (req, res) => {
  const rawdata = fs.readFileSync("./database/users.json");
  const jsondata = JSON.parse(rawdata);

  res.send(jsondata);
});

app.post(
  "/create-user/:email/:username/:lastFourCard/:paidSubscription/:dateOfPurchase/:dateOfExpiration",
  (req, res) => {
    const rawdata = fs.readFileSync("./database/users.json");
    const jsondata = JSON.parse(rawdata);
    const {
      email,
      username,
      lastFourCard,
      dateOfPurchase,
      dateOfExpiration,
      paidSubscription,
    } = req.params;
    jsondata[username] = {
      email,
      username,
      lastFourCard,
      paidSubscription,
      dateOfPurchase,
      dateOfExpiration,
    };
    const jsonData = JSON.stringify(jsondata);
    fs.writeFileSync("./database/users.json", jsonData);
    res.send("Success!");
  }
);

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
