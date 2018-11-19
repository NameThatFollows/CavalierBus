import React, { Component } from 'react';
import ReactMapboxGl, { Marker, Layer, Feature, Popup } from 'react-mapbox-gl';
import Papa from 'papaparse';
import styled from 'styled-components';
import moment from 'moment';
import * as axios from 'axios';
import { DateInput } from '@blueprintjs/datetime';
import { Spinner } from '@blueprintjs/core';

import './App.css';

import stops from './gtfs/stops.txt';
import shapes from './gtfs/shapes.txt';
import routes from './gtfs/routes.txt';
import trips from './gtfs/trips.txt';
import calendar from './gtfs/calendar.txt';

const Map = ReactMapboxGl({
  accessToken: 'pk.eyJ1IjoibmFtZXRoYXRmb2xsb3dzIiwiYSI6ImNqamtrMHkxaDZpNW8zcWxmMmh0cGh6amoifQ.bFvQzRnOFe8CSQA0wJQeKQ',
});

const lineLayout = {
  'line-cap': 'round',
  'line-join': 'round'
};

const linePaint = {
  'line-color': '#4790FF',
  'line-opacity': 0.3,
  'line-width': 4
};

const hoveredLinePaint = {
  'line-color': '#FFFF00',
  'line-opacity': 1,
  'line-width': 3
};

const selectedLinePaint = {
  'line-color': '#FF0000',
  'line-opacity': 1,
  'line-width': 3
};

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
      calendar: {},
      routes: {},
      shapes: {},
      stop_times: {},
      stops: {},
      trips: {},
      routesToShapes: {},
      today: {
        date: moment(),
      },
      selectedRoute: undefined,
      hoveredRoute: undefined,
      loading: true,
    };

    this.sidebarHover = this.sidebarHover.bind(this);
    this.sidebarUnhover = this.sidebarUnhover.bind(this);
    this.sidebarClick = this.sidebarClick.bind(this);

    this.lineHover = this.lineHover.bind(this);
    this.lineUnhover = this.lineUnhover.bind(this);
    this.lineClick = this.lineClick.bind(this);

    this.colorLine = this.colorLine.bind(this);
    this.uncolorLine = this.uncolorLine.bind(this);
    this.selectLine = this.selectLine.bind(this);

    this.changeDate = this.changeDate.bind(this);

    this.getCalendar = this.getCalendar.bind(this);
  }

  async componentDidMount() {
    this.setState((prevState) => {
      return {
        ...prevState,
        loading: true,
      };
    });

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

    await axios.get(routes).then((response) => {
      Papa.parse(response.data, {
        delimiter: ',',
        complete: (results, file) => {
          const routes = {};
          let rowNumber = 0;
          for (const result of results.data) {
            if (rowNumber !== 0) {
              if (!result[1]) {
                continue
              }
              const routeNumber = parseInt(result[1].split('_')[0])
              routes[routeNumber] = {
                id: routeNumber,
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

    await this.getCalendar();
  }

  render() {
    return (
      <div style={{
        width: '100%',
        margin: 'auto',
        position: 'relative',
      }}>
        {this.state.loading ?
          <div style={{
            width: '100vw',
            height: '100vh',
            zIndex: 100,
            position: 'absolute',
            top: 0,
            left: 0,
            background: '#00000055'
          }}>
            <div style={{
              top: '50%',
              left: '50%',
              position: 'absolute',
              transform: 'translate(-50%, -50%)',
              margin: '0 auto',
            }}>
              <Spinner size={200} />
            </div>
          </div>

        : <div style={{
          width: 300,
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0,
          background: '#FFFFFFAA',
          zIndex: 10,
          overflow: 'auto',
        }}>
          <div>
            <DateInput
              formatDate={(date) => moment(date).format('MMMM Do, YYYY')}
              parseDate={(str) => new Date(str)}
              onChange={this.changeDate}
              canClearSelection={false}
              minDate={moment().toDate()}
              maxDate={moment().add(1, 'year').toDate()}
              value={this.state.today.date.toDate()} />
          </div>
          {Object.keys(this.state.routesToShapes).map((routeID) => {
            const route = this.state.routes[routeID];
            return (
              <div
                style={{
                  height: 40,
                  padding: 10,
                  lineHeight: 1,
                }}
                key={route.id}
                onMouseOver={this.sidebarHover}
                onMouseOut={this.sidebarUnhover}
                onClick={this.sidebarClick}
                name={route.id}
              >
                {route.id}: {route.name}
              </div>
            )
          })}
        </div> }

        <div>
          <Map {...this.state.mapState}>
            <Layer type="line" layout={lineLayout} paint={linePaint}>
              {Object.keys(this.state.routesToShapes).map((routeID, index) => {
                for (const shapeID of Object.values(this.state.routesToShapes[routeID])) {
                  const wowowo = this.state.shapes[shapeID];
                  return (
                    <Feature
                      properties={{routeID: routeID}}
                      key={shapeID}
                      coordinates={wowowo}
                      onMouseEnter={this.lineHover}
                      onMouseLeave={this.lineUnhover}
                      onClick={this.lineClick} />
                  );
                }
              })}
            </Layer>

            {this.state.selectedRoute ?
              <Layer type="line" layout={lineLayout} paint={selectedLinePaint}>
                {Object.values(this.state.routesToShapes[this.state.selectedRoute]).map((shapeID, index) => {
                  for (const direction of Object.values(shapeID)) {
                    const wowowo = this.state.shapes[shapeID];
                    return (
                      <Feature key={shapeID} coordinates={wowowo} />
                    );
                  }
                })
              }
              </Layer> : undefined
            }

            {this.state.hoveredRoute ?
              <Layer type="line" layout={lineLayout} paint={hoveredLinePaint}>
                {Object.values(this.state.routesToShapes[this.state.hoveredRoute]).map((shapeID, index) => {
                  for (const direction of Object.values(shapeID)) {
                    const wowowo = this.state.shapes[shapeID];
                    return (
                      <Feature key={shapeID} coordinates={wowowo} />
                    );
                  }
                })
              }
              </Layer> : undefined
            }
          </Map>
        </div>
      </div>
    );
  }

  async getCalendar() {
    this.setState((prevState) => {
      return {
        ...prevState,
        loading: true,
      };
    });

    await axios.get(calendar).then((response) => {
      Papa.parse(response.data, {
        delimiter: ',',
        complete: (results, file) => {
          const calendar = {};
          let rowNumber = 0;

          const dayOfWeek = (this.state.today.date.day() + 6) % 7;
          console.log((this.state.today.date.day() + 6) % 7, dayOfWeek);
          for (const result of results.data) {
            if (rowNumber !== 0 && result[0]) {
              const startDate = moment(result[1]);
              const endDate = moment(result[2]);

              const days = result.slice(3, 10);

              if (this.state.today.date.diff(startDate) >= 0 &&
                endDate.diff(this.state.today.date) >= 0 &&
                parseInt(days[dayOfWeek]) === 1
              ) {
                calendar[result[0]] = {
                  serviceID: result[0],
                  startDate: moment(result[1]),
                  endDate: moment(result[2])
                };
              }
            }
            rowNumber++;
          }
          this.setState((prevState) => {
            return {
              ...prevState,
              calendar,
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
            if (rowNumber !== 0 && result[1]) {
              if (this.state.calendar[result[4]]) {
                trips[result[5]] = {
                  blockID: result[0],
                  routeID: parseInt(result[1].split('_')[0]),
                  directionID: result[2],
                  shapeID: result[3],
                  serviceID: result[4],
                  tripID: result[5],
                }
              }
            }
            rowNumber++;
          }

          const routesToShapes = {};

          for (const trip of Object.values(trips)) {
            if (!routesToShapes[trip.routeID]) {
              routesToShapes[trip.routeID] = {};
            }

            if (!routesToShapes[trip.routeID][trip.directionID]) {
              routesToShapes[trip.routeID][trip.directionID] = trip.shapeID;
            }
          }

          this.setState((prevState) => {
            return {
              ...prevState,
              trips,
              routesToShapes,
              loading: false,
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

              shapes[result[0]].push([parseFloat(result[2]), parseFloat(result[1])]);
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

    this.setState((prevState) => {
      return {
        ...prevState,
        loading: false,
      };
    });
  }

  changeDate(selectedDate, isUserChange) {
    if (isUserChange) {
      console.log(moment(selectedDate));
      this.setState((prevState) => {
        return {
          ...prevState,
          today: {
            ...prevState.today,
            date: moment(selectedDate),
          },
        };
      }, async () => {
        await this.getCalendar();
      });
    }
  }

  lineHover(event) {
    const routeID = parseInt(event.feature.properties.routeID);
    this.colorLine(routeID);
  }

  lineUnhover(event) {
    this.uncolorLine();
  }

  lineClick(event) {
    const routeID = parseInt(event.feature.properties.routeID);
    this.selectLine(routeID);
  }

  sidebarHover(event) {
    const target = event.target;
    const id = parseInt(target.getAttribute('name'));

    this.colorLine(id);
  }

  sidebarUnhover(event) {
    const target = event.target;
    const id = parseInt(target.getAttribute('name'));

    this.uncolorLine(id);
  }

  sidebarClick(event) {
    const target = event.target;
    const routeID = parseInt(target.getAttribute('name'));

    this.selectLine(routeID);
  }

  colorLine(routeID) {
    this.setState((prevState) => {
      return {
        ...prevState,
        hoveredRoute: routeID,
      };
    });
  }

  uncolorLine() {
    this.setState((prevState) => {
      return {
        ...prevState,
        hoveredRoute: undefined,
      };
    });
  }

  selectLine(routeID) {
    this.setState((prevState) => {
      const route = prevState.shapes[Object.values(prevState.routesToShapes[routeID])[0]];
      return {
        ...prevState,
        selectedRoute: this.state.selectedRoute === routeID ? undefined : routeID,
        hoveredRoute: undefined,
        mapState: {
          ...prevState.mapState,
          fitBounds: [
            route[0],
            route[route.length - 1]
          ],
        },
      };
    });
  }
}

export default App;


