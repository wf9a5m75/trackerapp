/*jshint esversion: 6 */

const request = require('request-promise'),     // for HTTP/Get access
  async = require('async');

module.exports = (CONFIGS, db) => {
  const ENTRY_POINT = "http://api.metro.net/agencies/" + CONFIGS.metro.agencyId;

  return new Promise((resolve, reject) => {

    // step 1: Read routes data from DB
    db.collection("routes").get()
      .then(snapshot => {
        if (snapshot.exist) {
          return null;
        }

        // If no routes data, get them from MetroAPI
        return request.get(ENTRY_POINT);
      })
      .then(body => {
        body = JSON.parse(body);

        if (CONFIGS.metro.routeIds) {
          body.items = body.items.filter(route => {
            return CONFIGS.metro.routeIds.indexOf(route.id) > -1;
          });
        }

        // step 2: Get meta data of the routes
        return new Promise((resolve1, reject1) => {
          async.mapLimit(body.items, 3, (route, next) => {

            request
              .get(ENTRY_POINT + "/routes/" + route.id + "/")
              .then(body1 => {
                next(null, JSON.parse(body1));
                return null;
              })
              .catch(error => {
                next(error);
              });

          }, (error, routes) => {
            if (error) {
              reject1(error);
            } else {
              resolve1(routes);
            }
          });
        });
      })
      .then(routes => {
        var batch = db.batch();
        routes.forEach(route => {
          batch.set(db.collection("routes").doc(route.id), route);
        });

        return batch.commit();
      })
      .then(resolve)
      .catch(reject);
  });
};
