import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';

/*
  Generated class for the FirestoreProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class FirestoreProvider {
  db: any;

  constructor() {
    firebase.initializeApp({
      apiKey: 'AIzaSyDT2Okhl0CGLht3JKf9xibLlX0mXZKUAo8',
      authDomain: "localhost",
      projectId: 'lametro-tracking-app'
    });

    this.db = firebase.firestore();
  }

  getDB() {
    return this.db;
  }
}
