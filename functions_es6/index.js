const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
import {
  verifyToken,
  decodeToken
} from "./src/services/TokenUtil";
require('dotenv').config()

const app = express();
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

// Automatically allow cross-origin requests
app.use(cors({
  origin: true
}));

let SECRET;
if (functions.config().twitch) {
  SECRET = functions.config().twitch.secret;
} else {
  SECRET = process.env.SECRET;
}

app.post('/', (req, res) => {
  let decoded_token;
  const data = req.body;

  const token = req.get('x-extension-jwt')

  try {
    decoded_token = verifyToken(token, SECRET);
  } catch (err) {
    console.error('JWT was invalid', err);
    res.status(401).json({});
    return;
  }

  const docRef = db.collection('channels').doc(decoded_token.user_id);

  const setAda = docRef.set({
    tabs: data.tabs,
  }).then(() => {
    return res.status(201).end();
  }).catch(() => {
    return res.status(400).end();
  });
});

app.get('/', (req, res) => {
  let decoded_token;
  const token = req.get('x-extension-jwt')

  try {
    decoded_token = decodeToken(token, SECRET);
  } catch (err) {
    console.error('JWT was invalid', err);
    res.status(401).json({});
    return;
  }

  const docRef = db.collection('channels').doc(decoded_token.channel_id);

  // Read the document.
  docRef.get().then(doc => {
    console.log(doc.data());
    return res.json(doc.data());
  }).catch((error) => {
    console.error(error);
    return res.status(400);
  });

});

// // GET /api/message/{messageId}
// app.get('/message/:messageId', (req, res) => {
//   const messageId = req.params.messageId;
//   res.set('Cache-Control', 'private, max-age=300');
//   res.json({
//     messageId
//   });
// });

// Expose the API as a function
exports.panel_information = functions.https.onRequest(app);
