(function(window) {
/*
  firebase.initializeApp({
    apiKey: 'AIzaSyB3bGp9ECq1osIIHgFYS3VCuVGDZIkQvxM',
    authDomain: 'localhost',
    projectId: 'lametro-4554b'
  });
*/
  firebase.initializeApp({
    apiKey: "AIzaSyAq_WGTMHfrJsybCc6fj6k9UVclH0YQZyo",
    authDomain: "localhost",
    projectId: "selfiewme-7ed5a"
  });

  window.initMap = function() {
    var app = new App("map", {
      center:{lat: 33.9974537, lng: -118.1770608},
      zoom: 8
    });
      window.initMap = undefined;
  };
/*
  window.addEventListener('load', function() {
    var db =
    db.collection("location").onSnapshot(function(snapshot) {
      snapshot.docChanges.forEach(function(change) {
        console.log(change);
      });
    });
  });
*/
  function App(divId, options) {
    var self = this;
    for (var name in google.maps.MVCObject.prototype) {
      self[name] = google.maps.MVCObject.prototype[name];
    }

    var mapDiv = document.getElementById(divId);
    var map = new google.maps.Map(mapDiv, options);
    self.set("map", map);



    self.set("markers", {});

    var db = firebase.firestore();
    self.set("db", db);

    // Watch the location changes
    db.collection("lametro/lametro-rail/location/").onSnapshot(function(snapshot) {

      snapshot.docChanges.forEach(function(change) {
        self["onDoc_" + change.type].call(self, change);
      });
    });
  }

  App.prototype = {
    onDoc_added: function(change) {
      var self = this;
      var data = change.doc.data();
      self.set(data.id, data);

      var markers = self.get("markers");
      markers[data.id] = new google.maps.Marker({
        title: data.id,
        position: {lat: data.latitude, lng: data.longitude},
        map: self.get("map"),
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 3
        }
      });
    },

    onDoc_modified: function(change) {
      var self = this;
      var data = change.doc.data();
      self.set(data.id, data);

      var markers = self.get("markers");
      markers[data.id].setPosition({lat: data.latitude, lng: data.longitude});
    },

    onDoc_removed: function(change) {
      var self = this;
      var data = change.doc.data();
      self.set(data.id, undefined);

      var markers = self.get("markers");
      markers[data.id] = null;
      delete markers[data.id];
    }

  };

})(window);
