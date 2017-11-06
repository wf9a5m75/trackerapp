import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  Marker,
  GoogleMapsAnimation,
  MyLocation
} from '@ionic-native/google-maps';
import { FirestoreProvider } from '../../providers/firestore/firestore';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  map: GoogleMap;
  mapReady: boolean = false;

  db: any;

  markers: {};

  constructor(
      public navCtrl: NavController,
      private googleMaps: GoogleMaps,
      private firestore: FirestoreProvider) {

    this.db = this.firestore.getDB();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad');
    this.loadMap();
  }

  loadMap() {
    let self = this;

    self.map = this.googleMaps.create('map_canvas', {
      camera: {
        target:{lat: 33.9974537, lng: -118.1770608},
        zoom: 10
      }
    });

    self.map.one(GoogleMapsEvent.MAP_READY).then(() => {
      console.log('map is ready to use');


      // Watch the location changes
      self.db.collection("locations").onSnapshot((snapshot) => {
        snapshot.docChanges.forEach((change) => {
          switch(change.type) {
            case "added":
              self.onAdded.call(self, change);
              break
            case "modified":
              self.onModified.call(self, change);
              break
            case "removed":
              self.onRemoved.bind.call(self, change);
              break
          }
        });
      });

    });
  }

  onAdded(change: any) {
    let self = this;
    let data: any = change.doc.data();
    self.map.addMarker({
      position: {'lat': data.latitude, 'lng': data.longitude},
      data: data
    }).then((marker: Marker) => {
      marker.getMap().set(data.id, marker);
    });
  }

  onModified(change: any) {
    let self = this;
    let data: any = change.doc.data();
    let marker: Marker = self.map.get(data.id);
    marker.set('data', data);
    marker.setPosition({'lat': data.latitude, 'lng': data.longitude});
  }

  onRemoved(change: any) {
    let self = this;
    let data: any = change.doc.data();
    let marker: Marker = self.map.get(data.id);
    marker.remove()
    self.map.set(data.id, null);
  }
}
