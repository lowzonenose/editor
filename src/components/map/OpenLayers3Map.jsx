import React from 'react'
import PropTypes from 'prop-types'
import style from '../../libs/style.js'
import isEqual from 'lodash.isequal'
import { loadJSON } from '../../libs/urlopen'
import 'ol/ol.css'
import 'ol-layerswitcher/src/ol-layerswitcher.css'


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
    olms.apply(this.map, newMapStyle);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    require.ensure(["ol", "ol-mapbox-style"], () => {
      if(!this.map) return
      this.updateStyle(nextProps.mapStyle)
    })
  }

  componentDidMount() {
    //Load OpenLayers dynamically once we need it
    require.ensure(["ol", "ol-mapbox-style", "ol-layerswitcher"], ()=> {
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
      const olGeolocation = require('ol/Geolocation').default
      const olTileJSON = require('ol/source/TileJSON').default
      const olObserable = require('ol/Observable');
      const olLayerGroup = require('ol/layer/Group').default;
      const olLayerSwitcher = require('ol-layerswitcher/src/ol-layerswitcher.js').default;

      var mousePositionControl = new olMousePosition({
         coordinateFormat: olCoordinate.createStringXY(4),
         projection: 'EPSG:4326',
         undefinedHTML: '&nbsp;'
      });

      const view =  new olView({
        zoom: 5,
        center: [2.5, 48.4]
      });

      const map = new olMap({
        target: this.container,
        layers: [
            new olLayerGroup({
                title: 'Overlays',
                layers: [
                    new olTileLayer({
                        id: 'OSM',
                        title: 'OSM',
                        source: new OSM(),
                        opacity: 0.5
                    })
                ]
            })
        ],
        view: view
      })

      map.addControl(mousePositionControl)

      var layerSwitcher = new olLayerSwitcher({
        tipLabel: 'Légende' // Optional label for button
      });

      map.addControl(layerSwitcher);

      var geolocation = new olGeolocation({
        projection: view.getProjection(),
        tracking: true
      });

      geolocation.on('change:position', function() {
        view.setCenter(geolocation.getPosition());
      });

      this.map = map

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
