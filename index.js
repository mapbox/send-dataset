#!/usr/bin/env node

var concat = require('concat-stream');
var opener = require('opener');
var tty = require('tty');
var path = require('path');
var fs = require('fs');
var MapboxClient = require('mapbox');
var mapbox = new MapboxClient(process.env.MAPBOX_ACCESS_TOKEN);
var geojsonhint = require('geojsonhint');
var normalize = require('geojson-normalize');
var hat = require('hat');
var ProgressBar = require('progress');

var argv = require('minimist')(process.argv.slice(2));
var BIG_LEN = 5000000;

if (argv.help || argv.h || !(argv._[0] || !tty.isatty(0))) {
    return help();
}

((argv._[0] && fs.createReadStream(argv._[0])) || process.stdin).pipe(concat(openData));

function openData(body) {
    if (body.length > BIG_LEN) {
        console.error('This file is very large, and will likely display very slowly in the dataset editor');
    }

    var geojson = null;
    try {
        geojson = JSON.parse(body.toString());
    }
    catch (err) {
        throw err;
    }

    geojson = normalize(geojson);

    if (geojson.features.length === 0) {
        throw new Error('There are no features in this file');
    }

    geojson.features.forEach(function(feature) {
        if (feature.geometry === null) {
            throw new Error('Null geomentry is not valid with the dataset api');
        }
        if(feature.geometry.type === 'GeometryCollection') {
            throw new Error('GeometryCollections are not valid with the dataset api');
        }
    });

    var batches = geojson.features.reduce(function(memo, feature) {
        feature.id = feature.id || hat();
        if (memo[memo.length-1].put.length === 100) {
            memo.push({put: [], delete: []})
        }
        memo[memo.length-1].put.push(feature);
        return memo;
    }, [{put: [], delete: []}])

    var datastName = argv._[0] ? argv._[0] : 'From CLI ' + (new Date().toISOString());
    mapbox.createDataset({name: datastName}, function(err, dataset) {
        if (err) {
            throw err;
        }
        else {
            dataset.size = body.length / 2;
            var bar = new ProgressBar('[:bar] :percent', {total: geojson.features.length, width: 20});
            bar.tick(0);
            saveBatches(dataset, batches, 0, bar);
        }
    });
}

function saveBatches(dataset, batches, idx, bar) {
    if (batches[idx] === undefined) return displayResource(dataset);
    mapbox.batchFeatureUpdate(batches[idx], dataset.id, function(err, results) {
        if (err && err.message) return killDataset(dataset, new Error(err.message));
        if (err) return killDataset(dataset, err);
        bar.tick(batches[idx].put.length);
        saveBatches(dataset, batches, idx+1, bar);
    });
}

function killDataset(dataset, err) {
    console.log('\n');
    console.error('failed to upload');
    mapbox.deleteDataset(dataset.id, function(deleteErr) {
        if (deleteErr) {
            console.log(deleteErr.message);
            throw deleteErr;
        }
        console.log(err.message);
        throw err;
    });
}

function displayResource(dataset) {
    var ext = dataset.size < 160000000 ? '/edit' : '';
    var url = 'http://mapbox.com/studio/datasets/'+ dataset.owner + '/' + dataset.id + ext;
    (argv.print ? console.log : opener)(url);
}

function help() {
    fs.createReadStream(path.join(__dirname, 'README.md')).pipe(process.stdout);
}
