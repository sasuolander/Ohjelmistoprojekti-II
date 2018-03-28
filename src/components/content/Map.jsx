import React, { Component } from "react";
import { feature } from "topojson-client";
import Country from "./map/Country";
import Loading from "./map/Loading";
import Timeline from "./map/Timeline";
import { geoPath } from "d3-geo";
import { geoTimes } from "d3-geo-projection";
import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography
} from "react-simple-maps";

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      geographyBorders: [],
      geographyNames: [],
      isGeographyHovered: false,
      hoveredGeographyName: "",
      isGeographyClicked: false,
      clickedGeographyName: "",
      mapZoomValue: 1,
      mapCenter: [0, 20],
      disableOptimization: false,
      touchError: false
    };
  }

  componentDidMount() {
    fetch("https://unpkg.com/world-atlas@1.1.4/world/110m.json")
      .then(response => response.json())
      .then(worldData =>
        this.setState({
          geographyBorders: feature(
            worldData,
            worldData.objects.countries
          ).features.sort((a, b) => {
            return a.id - b.id;
          })
        })
      )
      .catch(err => console.error(err));

    fetch(
      "https://raw.githubusercontent.com/tarmeli/Ohjelmistoprojekti-II/master/src/data/countryNames.json"
    )
      .then(response => response.json())
      .then(names =>
        this.setState({
          geographyNames: names.countries.sort((a, b) => {
            return a.id - b.id;
          })
        })
      )
      .catch(err => console.error(err));
  }

  toggleHover(i) {
    this.setState({
      isGeographyHovered: !this.state.isGeographyHovered,
      hoveredGeographyName: this.state.geographyNames[i].name
    });
  }

  mapProjection() {
    return geoTimes()
      .translate([800 / 2, 450 / 2])
      .scale(160);
  }

  onGeographyClick(geography, i) {
    const path = geoPath().projection(this.mapProjection());
    const centroid = this.mapProjection().invert(path.centroid(geography));
    this.setState(
      {
        isGeographyClicked: true,
        clickedGeographyName: this.state.geographyNames[i].name,
        mapZoomValue: 3,
        mapCenter: centroid,
        disableOptimization: true
      },
      () => {
        this.setState({
          disableOptimization: false
        });
      }
    );

    if (this.state.clickedGeographyName === this.state.geographyNames[i].name) {
      this.setState({
        isGeographyClicked: false,
        clickedGeographyName: "",
        mapZoomValue: 1,
        mapCenter: [0, 20]
      });
    }
  }

  checkGeographyName() {
    let geography;
    if (this.state.isGeographyClicked) {
      geography = this.state.clickedGeographyName;
    } else if (this.state.isGeographyHovered) {
      geography = this.state.hoveredGeographyName;
    } else {
      geography = "Select a country";
    }
    return geography;
  }

  setWeightValuesForHeatmap() {
    const weightDataForMap = [];
    const month = this.props.selectedMonth;
    const asset =
      this.props.selectedAsset === undefined ? 0 : this.props.selectedAsset;
    const assetClasses = this.props.geographicalWeightData.length
      ? this.props.geographicalWeightData[month].assetClasses[asset].weights
      : [];
    for (let i = 0; i < this.state.geographyNames.length; i++) {
      for (let j = 0; j < assetClasses.length; j++) {
        let id = assetClasses[j].countryId;
        let weight = assetClasses[j].weight;
        if (this.state.geographyNames[i].id === JSON.stringify(id)) {
          weightDataForMap.push(weight);
        }
      }
      if (!weightDataForMap[i]) {
        weightDataForMap.push(0);
      }
    }
    return weightDataForMap;
  }

  zoomOutOfGeography() {
    this.setState(
      {
        isGeographyClicked: false,
        mapZoomValue: 1,
        mapCenter: [0, 20],
        clickedGeographyName: "",
        disableOptimization: true
      },
      () => {
        this.setState({
          disableOptimization: false
        });
      }
    );
  }

  touchWarning(event) {
    if (event.touches.length === 1) {
      this.setState({
        touchError: true
      });
      setTimeout(() => {
        this.setState({
          touchError: false
        });
      }, 2000);
    }
  }

  renderMap() {
    const weightData = this.setWeightValuesForHeatmap();
    const optimization =
      this.state.disableOptimization || this.props.disableOptimization;
    const mapGeographies = (
      <Geographies
        disableOptimization={optimization}
        geography={this.state.geographyBorders}
      >
        {(geographies, projection) =>
          geographies.map((geography, i) => (
            <Geography
              style={{
                default: {
                  fill:
                    this.state.isGeographyClicked &&
                    this.state.clickedGeographyName ===
                      this.state.geographyNames[i].name
                      ? "steelblue"
                      : weightData[i] === 0
                        ? "#fcfcfc"
                        : `rgba(200,50,56, ${weightData[i] * 2})`,
                  stroke: "black",
                  strokeWidth: "0.5px",
                  outline: "none"
                },
                hover: {
                  fill: "rgba(200, 50, 56, 0.5)",
                  stroke: "black",
                  strokeWidth: "0.5px",
                  outline: "none"
                },
                pressed: {
                  fill: "tomato",
                  stroke: "black",
                  strokeWidth: "0.5px",
                  outline: "none"
                }
              }}
              key={geography + i}
              geography={geography}
              projection={projection}
              className="countries"
              onClick={() => this.onGeographyClick(geography, i)}
              onMouseOver={() => this.toggleHover(i)}
              onMouseLeave={() => this.toggleHover(i)}
            />
          ))
        }
      </Geographies>
    );

    const errorStyle = {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "10",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      color: "rgba(255, 255, 255, 1)",
      display: this.state.touchError === false ? "none" : "flex",
      margin: "0 auto",
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: "62px"
    };

    return (
      <article
        onTouchMove={this.touchWarning.bind(this)}
        className="tile is-child notification is-paddingless"
      >
        <div style={errorStyle}>
          <div>The map must be dragged with two fingers</div>
        </div>
        <ComposableMap
          width={800}
          height={450}
          style={{
            width: "100%",
            height: "auto",
            marginBottom: "-62px"
          }}
        >
          <ZoomableGroup
            center={this.state.mapCenter}
            zoom={this.state.mapZoomValue}
          >
            {mapGeographies}
          </ZoomableGroup>
        </ComposableMap>
        <button
          style={{ margin: "10px" }}
          className="button"
          onClick={() => this.zoomOutOfGeography()}
        >
          Zoom out
        </button>
        <Country country={this.checkGeographyName()} />
        <Timeline
          length={this.props.length}
          geographicalWeightData={this.props.geographicalWeightData}
          onChange={this.props.onChange}
          onAssetChange={this.props.onAssetChange}
          month={this.props.month}
          onMonthButtonClick={this.props.onMonthButtonClick}
        />
      </article>
    );
  }

  renderLoading() {
    return (
      <article className="tile is-child notification is-paddingless">
        <Loading color="tomato" />
      </article>
    );
  }

  render() {
    if (!this.props.geographicalWeightData.length) {
      return this.renderLoading();
    } else {
      return this.renderMap();
    }
  }
}

export default Map;
