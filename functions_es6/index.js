const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
import { verifyToken, decodeToken } from "./src/services/TokenUtil";
import { publishChannelMessage } from "./src/services/TwitchAPI";
require("dotenv").config();

admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

const cors = require('cors')({
  origin: true
});

let SECRET;
if (functions.config().twitch) {
  SECRET = functions.config().twitch.secret;
} else {
  SECRET = process.env.SECRET;
}

exports.set_panel_information = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    let decoded_token;
    const data = req.body;

    const token = req.get("x-extension-jwt");

    try {
      decoded_token = verifyToken(token, SECRET);
    } catch (err) {
      console.error("JWT was invalid", err);
      res.status(401).json({});
      return;
    }

    const docRef = db.collection("channels").doc(decoded_token.user_id);

    const setAda = docRef
      .set({
        tabs: data.tabs,
      })
      .then(() => {
        console.info("Channel ", decoded_token.channel_id, "updated succeeded");
        publishChannelMessage(decoded_token.channel_id, SECRET);
        return res.status(201).end();
      })
      .catch(error => {
        console.error(
          "Channel ",
          decoded_token.channel_id,
          "update failed to DB",
          error
        );
        return res.status(400).end();
      });
  });
});

exports.get_panel_information = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    let decoded_token;
    const token = req.get("x-extension-jwt");

    try {
      decoded_token = decodeToken(token, SECRET);
    } catch (err) {
      console.error("JWT was invalid", err);
      res.status(401).json({});
      return;
    }

    const docRef = db.collection("channels").doc(decoded_token.channel_id);

    // Read the document.
    docRef
      .get()
      .then(doc => {
        console.info("Channel ", decoded_token.channel_id, "info requested");
        return res.json(doc.data());
      })
      .catch(error => {
        console.error(error);
        return res.status(400);
      });
  });
});