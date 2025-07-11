import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import CommunityMap from "./CommunityMap";

/**
 * This component is for a standalone route that displays a map of all groups.
 * Use the "zoom", "lat" and "lng" query params to set the initial map view.
 */
const GroupsMap = () => {
  const { query } = useLocation()
  
  let center = {}
  if (query.lat && parseInt(query.lat) && query.lng && parseInt(query.lng)) {
    center = {center: {lat: parseInt(query.lat), lng: parseInt(query.lng)}}
  }
  
  return <CommunityMap
    groupTerms={{view: "all"}}
    zoom={parseInt(query?.zoom) || 1}
    initialOpenWindows={[]}
    showGroupsByDefault
    hideLegend
    {...center}
  />
}

export default registerComponent('GroupsMap', GroupsMap);


