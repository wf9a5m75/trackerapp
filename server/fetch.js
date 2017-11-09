/*jshint esversion: 6 */

const CONFIGS = require('./config.sample.json'),
  admin = require('firebase-admin');        // for Cloud Firestore

/*
 * Initialize firebase
 */
const serviceAccount = require(CONFIGS.firestore.credential);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: CONFIGS.firestore.databaseURL
});

/*
 * Crate a DB reference
 */
const db = admin.firestore();

require('./routes/getAllRoutes')(CONFIGS, db)
  .then(require('./routes/updateVehicleList')(CONFIGS, db))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
