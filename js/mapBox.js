/* eslint-disable */
import * as maptilersdk from '@maptiler/sdk';

export const displayMap = (locations) => {
  maptilersdk.config.apiKey =
    'LF0TAkydluHOvSi3IPBo';
  const map = new maptilersdk.Map({
    container: 'map', // container's id or the HTML element to render the map
    style:
      'https://api.maptiler.com/maps/ch-swisstopo-lbm-grey/style.json?key=LF0TAkydluHOvSi3IPBo',
    // center: [-118.113491, 34.111745], // starting position [lng, lat]
    // zoom: 3, // starting zoom
    scrollZoom: false,
  });
  map.on('load', () => {
    const bounds = new maptilersdk.LngLatBounds();
    locations.forEach((location) => {
      // Create an element for marker
      const el = document.createElement('div');
      el.className = 'marker';
      // Add the marker to the map
      new maptilersdk.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat(location.coordinates)
        .addTo(map);

      // Add popups
      new maptilersdk.Popup({ offset: 25 })
        .setLngLat(location.coordinates)
        .setHTML(
          `<H4>Day ${location.day}: ${location.description}</H4>`,
        )
        .addTo(map);
      // Extend the map bounds to include the current location
      bounds.extend(location.coordinates);
    });
    map.fitBounds(bounds, {
      padding: {
        top: 200,
        bottom: 200,
        left: 100,
        right: 100,
      },
      duration: 5000,
    });
  });
  // Disable zooming, scrolling, and rotating
  // map.scrollZoom.disable();
  // map.dragPan.disable();
  // map.touchZoomRotate.disable();
  // map.doubleClickZoom.disable();
  // map.keyboard.disable();
  // mapboxgl.accessToken =
  //   'pkeyJlIjoiam9uYXNzY2htZWR0bWFubiIsImEi0iJjanZpoweWMG8WM2puNGFtdjF0ZGpzNGttIn0. FsawlH24WAZYILfJa-qemw';

  // const map = new mapboxgl.Map({
  //   container: 'map',
  // });
};
