import React, { Component } from 'react';
import ReactMapboxGl, { Marker, Layer, Feature, Popup } from 'react-mapbox-gl';
import Papa from 'papaparse';
import styled from 'styled-components';
import moment from 'moment';
import scrollToComponent from 'react-scroll-to-component';
import * as axios from 'axios';
import { DateInput } from '@blueprintjs/datetime';
import { Spinner } from '@blueprintjs/core';

import './App.css';

import stops from './gtfs/stops.txt';
import shapes from './gtfs/shapes.txt';
import routes from './gtfs/routes.txt';
import trips from './gtfs/trips.txt';
import calendar from './gtfs/calendar.txt';
import stopTimes from './gtfs/stop_times.txt';

const Map = ReactMapboxGl({
  accessToken: process.env.REACT_APP_MAPBOX_API_KEY,
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
        style: 'mapbox://styles/namethatfollows/cjoyt2id543lo2slit3xuqj6z',
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
      stopTimes: {},
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

    this.sections = {};

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
                lat: parseFloat(result[0]),
                lon: parseFloat(result[2]),
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

    scrollToComponent(this.sections[115], { offset: 0, align: 'top', duration: 1500});
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

        : <div className="hideScroll"
	      style={{
          width: '20vw',
          minWidth: '200px',
          height: '35vh',
          position: 'absolute',
          bottom: 15,
          left: 15,
          zIndex: 10,
          overflow: 'auto',
        }}>
          <div className="datepicker-container">
            <DateInput
              formatDate={(date) => moment(date).format('MMMM Do, YYYY')}
              parseDate={(str) => new Date(str)}
              onChange={this.changeDate}
              canClearSelection={false}
              minDate={moment().toDate()}
              maxDate={moment().add(1, 'year').toDate()}
              popoverProps={{
                position: 'bottom',
                minimal: true,
              }}
              value={this.state.today.date.toDate()} />
          </div>
          <div>
            {Object.keys(this.state.routesToShapes).map((routeID) => {
              const route = this.state.routes[routeID];
              return (
                <div
                  style={{
                    height: 40,
                    padding: 10,
                    lineHeight: 1,
                    background: parseInt(this.state.selectedRoute) === parseInt(routeID) ? '#EEEEEE' : '',
                    cursor: 'pointer',
                  }}
                  key={route.id}
                  onMouseOver={this.sidebarHover}
                  onMouseOut={this.sidebarUnhover}
                  onClick={this.sidebarClick}
                  name={route.id}
                  ref={(section) => { this.sections[parseInt(route.id)] = section; }}
                >
                  {route.id}: {route.name}
                </div>
              )
            })}
          </div>
        </div> }

        <div>
          <Map {...this.state.mapState}>
            <Layer type="line" layout={lineLayout} paint={linePaint}>
              {Object.keys(this.state.routesToShapes).map((routeID, index) => {
                for (const shapeID of Object.values(this.state.routesToShapes[routeID])) {
                  const wowowo = this.state.shapes[shapeID] ? this.state.shapes[shapeID].path : undefined;
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

            {this.state.stops ?
              <Layer type='circle' paint={{
                'circle-radius': 5,
                'circle-color': '#4E52E5',
                'circle-opacity': 0.8
              }}
              minZoom={13}>
                {Object.values(this.state.stops).map((stopInfo, index) => {
                  return (
                    <Feature key={index} coordinates={[stopInfo.lon, stopInfo.lat]} />
                  )
                })}
              </Layer> : undefined
            }

            <Layer type="line" layout={lineLayout} paint={selectedLinePaint}>
            {this.state.selectedRoute ?
                Object.values(this.state.routesToShapes[this.state.selectedRoute]).map((shapeID, index) => {
                  for (const direction of Object.values(shapeID)) {
                    const wowowo = this.state.shapes[shapeID] ? this.state.shapes[shapeID].path : undefined;
                    return (
                      <Feature key={shapeID} coordinates={wowowo} />
                    );
                  }
                })
               : undefined
            }
            </Layer>

            {this.state.hoveredRoute ?
              <Layer type="line" layout={lineLayout} paint={hoveredLinePaint}>
                {Object.values(this.state.routesToShapes[this.state.hoveredRoute]).map((shapeID, index) => {
                  for (const direction of Object.values(shapeID)) {
                    const wowowo = this.state.shapes[shapeID] ? this.state.shapes[shapeID].path : undefined;
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
              const lon = parseFloat(result[2]);
              const lat = parseFloat(result[1]);

              if (!shapes[result[0]]) {
                shapes[result[0]] = {
                  path: [],
                  bottomLeft: [lon, lat],
                  topRight: [lon, lat],
                };
              }

              shapes[result[0]].path.push([lon, lat]);

              const newBL = shapes[result[0]].bottomLeft;
              const newTR = shapes[result[0]].topRight;

              if (lon < newBL[0]) {
                newBL[0] = lon;
              }

              if (lon > newTR[0]) {
                newTR[0] = lon;
              }

              if (lat < newBL[1]) {
                newBL[1] = lat;
              }

              if (lat > newTR[1]) {
                newTR[1] = lat;
              }

              shapes[result[0]].bottomLeft = newBL;
              shapes[result[0]].topRight = newTR;
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

    await axios.get(stopTimes).then((response) => {
      Papa.parse(response.data, {
        delimiter: ',',
        complete: (results, file) => {
          const stopTimes = {};
          let rowNumber = 0;
          for (const result of results.data) {
            if (rowNumber !== 0 && result[0]) {
              if (this.state.trips[result[0]]) {
                stopTimes[result[0]] = {
                  blockID: result[0],
                }
              }
            }
            rowNumber++;
          }

          this.setState((prevState) => {
            return {
              ...prevState,
              stopTimes,
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
          selectedRoute: undefined,
          hoveredRoute: undefined,
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
    console.log(routeID)
    console.log(this.sections[routeID]);
    scrollToComponent(this.sections[routeID], { offset: 0, align: 'top', duration: 1500});
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
            route.bottomLeft,
            route.topRight,
          ],
        },
      };
    });
  }
}

export default App;


