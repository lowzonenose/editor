import React from 'react'
import PropTypes from 'prop-types'
import style from '../../libs/style.js'
import isEqual from 'lodash.isequal'
import { loadJSON } from '../../libs/urlopen'
import 'ol/ol.css'


class OpenLayers3Map extends React.Component {
  static propTypes = {
    onDataChange: PropTypes.func,
    mapStyle: PropTypes.object.isRequired,
    accessToken: PropTypes.string,
    style: PropTypes.object,
  }

  static defaultProps = {
    onMapLoaded: () => {},
    onDataChange: () => {},
  }

  constructor(props) {
    super(props)
    this.map = null
    this.layer = null
    this.idSource = null
  }

  updateStyle(newMapStyle) {
    const olms = require('ol-mapbox-style');

    const map = this.map;
    const layer = this.layer;

    olms.applyStyle(layer, newMapStyle, this.idSource)
    .then(function () {
        // map.getLayers().forEach(function (lyr) {
        //     if (lyr.getProperties().id !== 'OSM') {
        //         map.removeLayer(lyr);
        //     }
        // });
        var copyLayer = layer;
        map.addLayer(layer);
        map.addLayer(copyLayer);
    })
    .then(function () {
        // FIXME ?
        map.getView().setCenter(newMapStyle.center);
        map.getView().setZoom(newMapStyle.zoom);
    })
    .catch(function (error) {
        map.addLayer(layer);
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    require.ensure(["ol", "ol-mapbox-style"], () => {
      if(!this.map) return
      this.updateStyle(nextProps.mapStyle)
    })
  }

  componentDidMount() {
    //Load OpenLayers dynamically once we need it
    //TODO: Make this more convenient
    require.ensure(["ol", "ol-mapbox-style"], ()=> {
      console.log('Loaded OpenLayers3 renderer')

      const olMap = require('ol/Map').default
      const olView = require('ol/View').default
      const olVectorTileLayer = require('ol/layer/VectorTile').default
      const olTileLayer = require('ol/layer/Tile').default
      const olVectorTile = require('ol/source/VectorTile').default
      const OSM = require('ol/source/OSM').default
      const MVT = require('ol/format/MVT').default
      const GeoJSON = require('ol/format/GeoJSON').default
      const olTileGrid = require('ol/tilegrid/TileGrid').default
      const olMousePosition = require('ol/control/MousePosition').default
      const olCoordinate = require('ol/coordinate')

      const id = Object.keys(this.props.mapStyle.sources)[0]; // FIXME only first sources !
      const type = (this.props.mapStyle.sources[id].type === 'vector') ? true : false

      const layer = new olVectorTileLayer({
          id: 'current',
          source : new olVectorTile({
              tilePixelRatio: 1,
              format: type ? new MVT() : new GeoJSON(),
              url: type ? this.props.mapStyle.sources[id].url : this.props.mapStyle.sources[id].data
          }),
          declutter: true
      })

      var mousePositionControl = new olMousePosition({
        coordinateFormat: olCoordinate.createStringXY(4),
        projection: 'EPSG:4326',
        undefinedHTML: '&nbsp;'
      });

      const map = new olMap({
        target: this.container,
        layers: [
            new olTileLayer({
                id: 'OSM',
                title: 'OSM',
                source: new OSM(),
                opacity: 0.5
            })
        ],
        view: new olView({
          zoom: this.props.mapStyle.zoom || 5,
          center: this.props.mapStyle.center || [2.5, 48.4]
        })
      })

      map.addControl(mousePositionControl)

      this.map = map
      this.layer = layer
      this.idSource = id

      this.updateStyle(this.props.mapStyle)
    })
  }

  render() {
    return <div
      ref={x => this.container = x}
      style={{
        position: "fixed",
        top: 40,
        right: 0,
        bottom: 0,
        height: 'calc(100% - 40px)',
        width: "75%",
        backgroundColor: '#fff',
        ...this.props.style,
      }}>
    </div>
  }
}

export default OpenLayers3Map
