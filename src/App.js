import React, { Component } from 'react';
import ReactMapboxGl, { Marker, Layer, Feature, Popup } from 'react-mapbox-gl';
import Papa from 'papaparse';
import styled from 'styled-components';
import * as axios from 'axios';

import './App.css';

import stops from './gtfs/stops.txt';
import shapes from './gtfs/shapes.txt';
import routes from './gtfs/routes.txt';
import trips from './gtfs/trips.txt';

const Map = ReactMapboxGl({
  accessToken: 'pk.eyJ1IjoibmFtZXRoYXRmb2xsb3dzIiwiYSI6ImNqamtrMHkxaDZpNW8zcWxmMmh0cGh6amoifQ.bFvQzRnOFe8CSQA0wJQeKQ',
});

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mapState: {
        style: 'mapbox://styles/mapbox/streets-v9',
        center: [-76.286, 36.851],
        fitBounds: [
          [-76.406, 36.861],
          [-76.286, 36.781],
        ],
        fitBoundsOptions: {
          padding: 200,
        },
        containerStyle: {
          height: '100vh',
          width: '100vw',
        },
      },
      stops: {},
      routes: {},
      shapes: {},
      stop_times: {},
      trips: {},
      routesToShapes: {},
    };
  }

  async componentDidMount() {
    await axios.get(stops).then((response) => {
      Papa.parse(response.data, {
        delimiter: ',',
        complete: (results, file) => {
          const stops = {};
          let rowNumber = 0;
          for (const result of results.data) {
            if (rowNumber !== 0) {
              stops[result[3]] = {
                id: result[3],
                lat: result[0],
                lon: result[2],
                name: result[4],
              }
            }
            rowNumber++;
          }
          this.setState((prevState) => {
            return {
              ...prevState,
              stops,
            };
          });
        }
      });
    });

    await axios.get(shapes).then((response) => {
      Papa.parse(response.data, {
        delimiter: ',',
        complete: (results, file) => {
          const shapes = {};
          let rowNumber = 0;
          for (const result of results.data) {
            if (rowNumber !== 0) {
              if (!shapes[result[0]]) {
                shapes[result[0]] = [];
              }

              shapes[result[0]].push({
                lat: result[1],
                lon: result[2],
              });
            }
            rowNumber++;
          }
          this.setState((prevState) => {
            return {
              ...prevState,
              shapes,
            };
          });
        }
      });
    });

    await axios.get(routes).then((response) => {
      Papa.parse(response.data, {
        delimiter: ',',
        complete: (results, file) => {
          const routes = {};
          let rowNumber = 0;
          for (const result of results.data) {
            if (rowNumber !== 0) {
              routes[result[1]] = {
                id: result[1],
                name: result[0],
              }
            }
            rowNumber++;
          }
          this.setState((prevState) => {
            return {
              ...prevState,
              routes,
            };
          });
        }
      });
    });

    await axios.get(trips).then((response) => {
      Papa.parse(response.data, {
        delimiter: ',',
        complete: (results, file) => {
          const trips = {};
          let rowNumber = 0;
          for (const result of results.data) {
            if (rowNumber !== 0) {
              trips[result[5]] = {
                blockID: result[0],
                routeID: result[1],
                directionID: result[2],
                shapeID: result[3],
                serviceID: result[4],
                tripID: result[5],
              }
            }
            rowNumber++;
          }

          const routesToShapes = {};

          for (const trip of Object.values(trips)) {
            if (!routesToShapes[trip.routeID]) {
              routesToShapes[trip.routeID] = {
                0: undefined,
                1: undefined,
              };
            }

            if (trip.directionID == 0) {
              if (!routesToShapes[trip.routeID][0]) {
                routesToShapes[trip.routeID][0] = trip.shapeID;
              }
            } else {
              if (!routesToShapes[trip.routeID][1]) {
                routesToShapes[trip.routeID][1] = trip.shapeID;
              }
            }
          }

          console.log(routesToShapes);

          this.setState((prevState) => {
            return {
              ...prevState,
              trips,
            };
          });
        }
      });
    });
  }

  render() {
    return (
      <div style={{
        width: '100%',
        margin: 'auto',
        position: 'relative',
      }}>
        <div style={{
          width: 300,
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0,
          background: '#FFFFFFAA',
          zIndex: 10,
        }}>
          Hello
        </div>

        <div style={{}}>
          <Map {...this.state.mapState}>
          </Map>
        </div>
      </div>
    );
  }
}

export default App;
