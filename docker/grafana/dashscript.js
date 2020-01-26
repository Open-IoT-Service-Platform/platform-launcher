/*
Copyright (c) 2018 Intel Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

// accessible variables in this scope
var window, document, ARGS, $, jQuery, moment, kbn;

// Setup some variables
var dashboard;

// All url parameters are available via the ARGS object
var ARGS;

// Initialize a skeleton with nothing but a rows array and service object
dashboard = {
    rows : [],
};

// Set default time
// time can be overridden in the url using from/to parameters, but this is
// handled automatically in grafana core during dashboard initialization
dashboard.time = {
    from: "now-1h",
    to: "now"
};

var rows = 1;
var name = "No Name";
var queries = [];
var metrics = [];
var asciiA = 65;

if (!_.isUndefined(ARGS.rows)) {
    rows = parseInt(ARGS.rows, 10);
}

if (!_.isUndefined(ARGS.name)) {
    name = ARGS.name;
}

if (!_.isUndefined(ARGS.metrics)) {
    metrics = ARGS.metrics.split(",");
}


for (var i = 0; i < metrics.length; i++) {
    queries.push({
        "aggregator": "sum",
        "downsampleAggregator": "avg",
        "downsampleFillPolicy": "none",
        "metric": metrics[i],
        "refId": String.fromCharCode(asciiA + i)
    });
}

dashboard.title = name;

for (var i = 0; i < rows; i++) {
    dashboard.rows.push({
        title: 'Chart',
        height: '900px',
        panels: [
        {
            title: 'Metrics of Account: ' + name,
            type: 'graph',
            datasource: 'KairosDB',
            span: 12,
            fill: 1,
            linewidth: 2,
            targets: queries,
            seriesOverrides: [],
            tooltip: {
                shared: true
            }
        }]
    });
}

return dashboard;
