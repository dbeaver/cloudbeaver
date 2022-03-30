/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./react-leaflet.d.ts" />

import type geojson from 'geojson';
import leaflet from 'leaflet';
import { useCallback, useEffect, useState } from 'react';
import { MapContainer, GeoJSON, LayersControl, TileLayer } from 'react-leaflet';
import type { TileLayerProps } from 'react-leaflet';
import styled, { css } from 'reshadow';

import { useSplit } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { IResultSetElementKey, IResultSetValue } from '@cloudbeaver/plugin-data-viewer';

import baseStyles from './styles/base.scss';

export interface IAssociatedValue {
  key: string;
  value: IResultSetValue;
}

interface IFeatureProperties {
  srid: number;
  associatedCell: IResultSetElementKey;
}

export interface IGeoJSONFeature extends GeoJSON.Feature<GeoJSON.GeometryObject, IFeatureProperties> {
  type: 'Feature';
  bbox?: geojson.BBox;
}

interface IBaseTile extends TileLayerProps {
  name: string;
  checked?: boolean;
}

interface Props {
  geoJSON: IGeoJSONFeature[];
  getAssociatedValues: (cell: IResultSetElementKey) => IAssociatedValue[];
}

const baseTiles: Record<'street' | 'topography', IBaseTile> = {
  street: {
    name: 'gis_presentation_base_tile_street_name',
    checked: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 18,
    id: 'osm.streets',
  },
  topography: {
    name: 'gis_presentation_base_tile_topography_name',
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,'
    + ' &copy; <a href="http://viewfinderpanoramas.org" target="_blank">SRTM</a>,'
    + ' &copy; <a href="https://opentopomap.org" target="_blank">OpenTopoMap</a>',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17,
  },
};

const geojsonMarkerOptions: leaflet.CircleMarkerOptions = {
  radius: 4,
  weight: 3,
};

const popupOption: leaflet.PopupOptions = {
  closeButton: true,
  minWidth: 260,
  maxWidth: 800,
  maxHeight: 500,
};

function polyStyle() {
  const objColor = 'blue';

  return {
    weight: 2,
    color: objColor,
  };
}

function getCRS(feature?: IGeoJSONFeature): leaflet.CRS {
  switch (feature?.properties?.srid) {
    case 0:
      return leaflet.CRS.Simple;
    case 3857:
      return leaflet.CRS.EPSG3857;
    case 4326:
      return leaflet.CRS.EPSG4326;
    case 3395:
      return leaflet.CRS.EPSG3395;
    case 900913:
      return leaflet.CRS.EPSG900913;
    default:
      return leaflet.CRS.EPSG3857;
  }
}

const styles = css`
  MapContainer {
    width: 100%;
    height: 100%;
  }
`;

export const LeafletMap: React.FC<Props> = function LeafletMap({ geoJSON, getAssociatedValues }) {
  const splitContext = useSplit();
  const translate = useTranslate();

  const [mapRef, setMapRef] = useState<leaflet.Map | null>(null);
  const [geoJSONLayerRef, setGeoJSONLayerRef] = useState<leaflet.GeoJSON | null>(null);

  const crs = getCRS(geoJSON[0]);

  const onEachFeature = useCallback((feature: IGeoJSONFeature, layer: leaflet.Layer) => {
    const associatedValues = getAssociatedValues(feature.properties.associatedCell);
    if (associatedValues.length > 0) {
      let popupContent = '';

      popupContent += '<table>';
      for (let i = 0; i < associatedValues.length; i++) {
        const { key, value } = associatedValues[i];

        if (value === undefined || typeof value === 'object') {
          continue;
        }

        popupContent += '<tr><td>' + key + '</td><td>' + value + '</td></tr>';
      }
      popupContent += '</table>';
      layer.bindPopup(popupContent, popupOption);
    }
  }, [getAssociatedValues]);

  useEffect(() => {
    if (geoJSONLayerRef && mapRef) {
      geoJSONLayerRef.clearLayers();

      for (let i = 0; i < geoJSON.length; i++) {
        geoJSONLayerRef.addData(geoJSON[i]);
      }

      const bounds = geoJSONLayerRef.getBounds();

      if (Object.keys(bounds).length === 0) {
        return;
      }

      if (crs === leaflet.CRS.Simple) {
        const maxDimension = Math.max(bounds.getNorth() - bounds.getSouth(), bounds.getEast() - bounds.getWest());
        mapRef.setMinZoom(-5);
        if (maxDimension > 0) {
          mapRef.fitBounds(bounds);
        } else {
          mapRef.setView(bounds.getCenter(), mapRef.getZoom());
        }
      } else {
        mapRef.fitBounds(bounds);
      }
    }
  }, [geoJSON, geoJSONLayerRef, crs, mapRef]);

  useEffect(() => {
    if (mapRef) {
      mapRef.invalidateSize();

      if (mapRef.options.crs?.code !== crs.code) {
        const center = mapRef.getCenter();
        mapRef.options.crs = crs;
        mapRef.setView(center);
      }
    }
  }, [splitContext.isResizing, splitContext.mode, crs, mapRef]);

  return styled(styles, baseStyles)(
    <MapContainer crs={crs} whenCreated={setMapRef} zoom={12}>
      <GeoJSON
        // data is not optional property, see react-leaflet.d.ts
        // data={[]}
        ref={setGeoJSONLayerRef}
        style={polyStyle}
        pointToLayer={(_, latlng) => leaflet.circleMarker(latlng, geojsonMarkerOptions)}
        onEachFeature={onEachFeature}
      />
      {crs !== leaflet.CRS.Simple && (
        <LayersControl>
          <LayersControl.BaseLayer
            name={translate(baseTiles.street.name)}
            checked={baseTiles.street.checked}
          >
            <TileLayer
              attribution={baseTiles.street.attribution}
              url={baseTiles.street.url}
              maxZoom={baseTiles.street.maxZoom}
              id={baseTiles.street.id}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer
            name={translate(baseTiles.topography.name)}
            checked={baseTiles.topography.checked}
          >
            <TileLayer
              attribution={baseTiles.topography.attribution}
              url={baseTiles.topography.url}
              maxZoom={baseTiles.topography.maxZoom}
              id={baseTiles.topography.id}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
      )}
    </MapContainer>
  );
};