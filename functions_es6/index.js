const functions = require("firebase-functions");
const cors = require('cors')({
  origin: true
});

exports.testEndpoint = functions.https.onRequest((req, res) => {
  // Enable CORS using the `cors` express middleware. Needed for Twitch Extnesion
  cors(req, res, () => {
    // ...
    res.json({message: 'Hello' });
  });
});
