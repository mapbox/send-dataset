# send-dataset

This is a clone of `geojsonio-cli` for the Mapbox studio dataset editor.

Shoot files from your shell to the [Mapbox Studio dataset editor](https://www.mapbox.com/studio/datasets/) for fast
visualization and editing. This is a [node.js](http://nodejs.org) module and thus requires
node.

Read or pipe a file

    send-dataset map.geojson
    send-dataset < run.geojson

Options:

    --print prints the url rather than opening it
    --domain="http://custominstancedomain.com/"

## installation

    npm install -g send-dataset

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
