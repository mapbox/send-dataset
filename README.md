# send-dataset

This is a clone of [geojsonio-cli](https://github.com/mapbox/geojsonio-cli) for the Mapbox studio dataset editor.

Shoot files from your shell to the [Mapbox Studio dataset editor](https://www.mapbox.com/studio/datasets/) for fast
visualization and editing. This is a [node.js](http://nodejs.org) module and thus requires
node.

Read or pipe a file

```sh
MAPBOX_ACCESS_TOKEN=<token> send-dataset map.geojson
MAPBOX_ACCESS_TOKEN=<token> send-dataset < run.geojson
```

Options:

`--name 'Dataset Name' Use the provided dataset name instead of deriving it`
`--print prints the url rather than opening it`
`--print-id prints the Dataset ID rather than opening it`

## installation

`npm install -g send-dataset`

`send-dataset` requires that you have a [Mapbox API access token](https://www.mapbox.com/studio/account/tokens/) in your enviroment as `MAPBOX_ACCESS_TOKEN`. This token **MUST HAVE** the `datasets:write` scope.

## examples

[pipe wkt through wellknown into send-dataset to get magic](https://github.com/mapbox/wellknown):

```sh
npm install -g send-dataset
npm install -g wellknown
echo "MultiPoint(0 0, 1 1, 3 3)" | wellknown | send-dataset
```

[pipe grep'ed geojson through geojsonify](https://github.com/blackmad/geojsonify):

```sh
npm install -g send-dataset
npm install -g geojsonify
grep -h something *json | geojsonify | send-dataset
```

[convert kml or gpx to geojson and push it to geojson.io](https://github.com/mapbox/togeojson):

```sh
npm install -g send-dataset
npm install -g togeojson
togeojson foo.kml | send-dataset
```

copy the generated url instead of opening it in a browser (on OSX)

```sh
send-dataset foo.geojson --print | pbcopy
```

simplify geojson with [simplify-geojson](https://github.com/maxogden/simplify-geojson)

```sh
npm install simplify-geojson send-dataset csv2geojson -g
curl https://raw.github.com/maxogden/simplify-geojson/master/test-data/oakland-route.csv | \
  csv2geojson --lat "LATITUDE N/S" --lon "LONGITUDE E/W" --line true | \
  simplify-geojson -t 0.001 | \
  send-dataset
```
