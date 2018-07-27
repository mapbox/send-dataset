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
var queue = require('d3-queue').queue;

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

    var datasetName = argv._[0] ? path.basename(argv._[0], '.geojson') : 'From CLI ' + (new Date().toISOString());
    mapbox.createDataset({name: datasetName}, function(err, dataset) {
        if (err) {
            throw err;
        }
        else {
            dataset.size = body.length / 2;
            var bar = new ProgressBar('[:bar] :percent', {total: geojson.features.length, width: 20});
            bar.tick(0);
            saveBatches(dataset, geojson.features, bar);
        }
    });
};

function saveBatches(dataset, features, bar) {
    var q = queue(17);
    features.forEach(function(feature) {
        q.defer(function(done) {
            saveFeature(dataset, feature, 0, function() {
                bar.tick(1);
                done();
            });     
        });
    });

    q.awaitAll(function(err) {
        if (err) console.log(err.stack);
        if (err) return killDataset(dataset, err);
        displayResource(dataset); 
    });
};

var start = 0;
var requests = 0;
function saveFeature(dataset, feature, tries, cb) {
    start = start || Date.now();
    if (requestRate() >= 40) return setTimeout(function() {
        saveFeature(dataset, feature, tries, cb);
    }, 10);
    requests++;
    mapbox.insertFeature(feature, dataset.id, function(err) {
        if (err && tries < 5) return cb(err);
        else if (err) return setTimeout(function() {
          saveFeature(dataset, feature, tries+1, cb);
        }, 250);
        cb();
    });
};

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
};

function displayResource(dataset) {
    var ext = dataset.size < 160000000 ? '/edit' : '';
    var url = 'https://www.mapbox.com/studio/datasets/'+ dataset.owner + '/' + dataset.id + ext;
    (argv.print ? console.log : opener)(url);
};

function help() {
    fs.createReadStream(path.join(__dirname, 'README.md')).pipe(process.stdout);
};

function requestRate() {
    var time = Date.now() - start;
    return Math.ceil(requests/(time/1000));
}
