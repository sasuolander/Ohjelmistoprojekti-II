import React, { Component } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import Tooltip from "./Tooltip";

class Map extends Component {
  constructor() {
    super();
    this.state = {
      worldData: [],
      countryNames: [],
      countryHover: false,
      activeCountry: "",
      clicked: false,
      clickedCountry: ""
    };
  }

  toggleHover(i) {
    this.setState({
      countryHover: !this.state.countryHover,
      activeCountry: this.state.worldData[i].id
    });
  }

  componentDidMount() {
    fetch("https://unpkg.com/world-atlas@1.1.4/world/110m.json")
      .then(response => response.json())
      .then(worldData =>
        this.setState({
          worldData: feature(worldData, worldData.objects.countries).features.sort((a, b) => {
            return a.id - b.id;
          })
        })
      )
      .catch(err => console.error(err));

      fetch("https://raw.githubusercontent.com/tarmeli/Ohjelmistoprojekti-II/master/src/data/countryNames.json")
      .then(response => response.json())
      .then(names => this.setState({
        countryNames: names.sort((a, b) => {
          return a.id - b.id
        })
      }))
      .catch(err => console.error(err));
  }

  onClick(i) {
    console.log(this.state.worldData, this.state.countryNames)
    this.setState({
      clicked: true,
      clickedCountry: this.state.countryNames[i-3].name
    })
  }

  renderTooltip() {
    return this.state.clicked ? <Tooltip country={this.state.clickedCountry}/> : null;
  }

  render() {
    let countryStyle = {
      fill: "#CCCCCC",
      stroke: "#000000",
      strokeWidth: "0.5px"
    };

    let activeStyle = {
      fill: "pink",
      stroke: "#000000",
      strokeWidth: "0.5px"
    };

    let svgStyle = {
    }

    let containerStyle = {
      width: "100%",
      display: "block",
      margin: "auto",
      textAlign: "center"
    }

    const projection = geoMercator().scale(100);
    const pathGenerator = geoPath().projection(projection);
    const countries = this.state.worldData.map((d, i) => (
      <path
        style={
          this.state.countryHover &&
          this.state.activeCountry === this.state.worldData[i].id
            ? activeStyle
            : countryStyle
        }
        key={"path" + i}
        d={pathGenerator(d)}
        className="countries"
        onClick={() => this.onClick(i)}
        onMouseOver={() => this.toggleHover(i)}
        onMouseLeave={() => this.toggleHover(i)}
      />
    ));
    return (
      <div style={containerStyle}>
        <svg style={svgStyle} preserveAspectRatio="xMidYMin" viewBox="82.5 20 800 450">
          {countries}
        </svg>
        <div>{this.renderTooltip()}</div>
      </div>
    );
  }
}

export default Map;
