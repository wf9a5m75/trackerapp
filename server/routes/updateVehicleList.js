/*jshint esversion: 6 */

const async = require('async'),             // asynchronous flow control
  request = require('request-promise'),     // for HTTP/Get access
  CronJob = require('cron').CronJob;        // for repeating job


module.exports = (CONFIGS, db) => {
  const ENTRY_POINT = "http://api.metro.net/agencies/" + CONFIGS.metro.agencyId;



  return ((result) => {

    //-------------------------------
    // step 0: Read data from the DB
    //-------------------------------
    db.collection("locations").get()
      .then(snapshot => {
        var prevData = {};
        snapshot.forEach(doc => {
          var data = doc.data();
          prevData[doc.id] = data;
        });
        return prevData;
      })
      .then(prevData => {

        new CronJob('*/10 * * * * *', () => {
          //------------------------------------
          // step 1: Get the current vehicle list
          //------------------------------------
          request.get(ENTRY_POINT + "/vehicles/")
            .then(body => {
              body = JSON.parse(body);
              if (!("items" in body)) {
                // ignore if the API does not return the data correctly
                console.log('api error');
                return null;
              }

              var currentData = {};
              var timestamp = Date.now();
              body.items.forEach(vehicle => {
                currentData[vehicle.id] = vehicle;
              });

              //--------------------------------------------------------------------
              // Step2 : If filter condition is specified, do filtering
              //--------------------------------------------------------------------
              if (CONFIGS.metro.routeIds) {
                body.items = body.items.filter((vehicle) => {
                  return CONFIGS.metro.routeIds.indexOf(vehicle.route_id) > -1;
                });

              }

              //--------------------------------------------------------------------
              // Step3 : Skip updating if the vehicle is located at the same point
              //--------------------------------------------------------------------

              if (prevData) {
                body.items = body.items.filter((vehicle) => {
                  return (!(vehicle.id in prevData)) ||
                    vehicle.seconds_since_report !== prevData[vehicle.id].seconds_since_report;
/*
                  return (!(vehicle.id in prevData)) ||
                    prevData[vehicle.id].latitude !== vehicle.latitude ||
                    prevData[vehicle.id].longitude !== vehicle.longitude ||
                    prevData[vehicle.id].heading !== vehicle.heading;
*/
                });
              }

              //--------------------------------
              // Step4: Calculate log timestamp
              //--------------------------------
              body.items = body.items.map(vehicle => {
                vehicle.timestamp = timestamp - vehicle.seconds_since_report * 1000;
                //delete vehicle.seconds_since_report;
                return vehicle;
              });

              var updateCnt = body.items.length;
              if (updateCnt === 0) {
                console.log('no update', new Date());
                return null;
              }

              //------------------------
              // Step5: Update the DB
              //------------------------
              var batch = db.batch();
              body.items.forEach(vehicle => {
                batch.set(db.collection("locations").doc(vehicle.id), vehicle);
              });

              prevData = currentData;
              console.log('updateCnt: ', updateCnt, new Date());

              return batch.commit();
            })
            .catch(error => {
              console.error(error);
            });
        }, null, true);
        return null;
      })
      .catch(error => {
        console.error(error);
      });

  });
};
