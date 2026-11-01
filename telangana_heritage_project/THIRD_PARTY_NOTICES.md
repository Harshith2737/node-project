# Third-party notices

## Leaflet 1.9.4

The frontend loads the Leaflet 1.9.4 browser build from the official unpkg distribution URL. Leaflet is distributed under the BSD 2-Clause License.

Project: https://github.com/Leaflet/Leaflet  
Release: https://github.com/Leaflet/Leaflet/releases/tag/v1.9.4  
License: https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE

```text
BSD 2-Clause License

Copyright (c) 2010-2023, Volodymyr Agafonkin
Copyright (c) 2010-2011, CloudMade
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
```

## OpenStreetMap

Map tiles are requested from `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. Visible map attribution is provided in the map control. OpenStreetMap data is available under the Open Database License (ODbL); the standard tile service has its own usage policy and no service-level guarantee.

- Copyright and attribution: https://www.openstreetmap.org/copyright
- Tile usage policy: https://operations.osmfoundation.org/policies/tiles/

The application requests tiles for the area a visitor actively views. It must not bulk-download, prefetch, package or scrape tile imagery.

## Wikidata

Where a destination coordinate is identified as Wikidata-derived, the underlying Wikidata facts are available under CC0. See https://www.wikidata.org/wiki/Wikidata:Data_access.

## Destination descriptions and reference data

Destination descriptions link to the official Telangana Tourism portal, the Telangana state investment/tourism policy page, or the relevant district administration tourism page. Coordinate-source links are recorded per destination in `frontend/data/destinations.json`. Coordinates are included as approximate discovery points and should be reviewed before they are used for navigation.
