/*jshint esversion: 6 */

const CronJob = require('cron').CronJob,    // for repeating job
  request = require('request-promise'),     // for HTTP/Get access
  admin = require('firebase-admin');        // for Cloud Firestore

/*
 * Initialize app
 */
var serviceAccount = require("./lametro-tracking-app-firebase-adminsdk-tt9nw-529b5795e0.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://lametro-tracking-app.firebaseio.com"
});

/*
 * Crate a DB reference
 */
var db = admin.firestore(),
  prevData = null;              // for detecting which data is updated

//-------------------------------
// step 1: Read data from the DB
//-------------------------------
db.collection("locations").get()
  .then(snapshot => {
    prevData = {};
    snapshot.forEach(doc => {
      var data = doc.data();
      prevData[doc.id] = data;
    });
    syncLocations();
  })
  .catch(error => {
    console.log('[warn] Can not get previous data', error);
    syncLocations();
  });

const updateVehicleList = () => {
  //--------------------------------------
  // step 2: Get the current vehicle list
  //--------------------------------------
  request.get("http://api.metro.net/agencies/lametro-rail/vehicles/")
    .then(body => {
      body = JSON.parse(body);
      if (!("items" in body)) {
        return;
      }
      var currentData = {};
      var timestamp = Date.now();
      body.items.forEach(vehicle => {
        currentData[vehicle.id] = vehicle;
      });

      //--------------------------------------------------------------------
      // Step3 : Skip updating if the vehicle is located at the same point
      //--------------------------------------------------------------------
      if (prevData) {
        body.items = body.items.filter((vehicle) => {

          return (!(vehicle.id in prevData)) ||
            prevData[vehicle.id].latitude !== vehicle.latitude ||
            prevData[vehicle.id].longitude !== vehicle.longitude ||
            prevData[vehicle.id].heading !== vehicle.heading;
        });
      }

      //------------------------
      // Calculate log timestamp
      //------------------------
      body.items = body.items.map(vehicle => {
        vehicle.timestamp = timestamp - vehicle.seconds_since_report * 1000;
        delete vehicle.seconds_since_report;
        return vehicle;
      });

      var updateCnt = body.items.length;
      //------------------------
      // Step4: Update records
      //------------------------
      if (updateCnt > 0) {
        var batch = db.batch();
        body.items.forEach(vehicle => {
          batch.set(db.collection("locations").doc(vehicle.id), vehicle);
        });

        batch.commit()
          .then(res => {
            prevData = currentData;
            console.log("updated: ", updateCnt);
          })
          .catch(error => {
            console.error(error);
          });
      }
    });
};

//----------------------------------------------------------------
// Step5: Check the vehicle list every 10 sec.
//----------------------------------------------------------------
const syncLocations = () => {
  new CronJob('*/10 * * * * *', updateVehicleList, null, true);
};
