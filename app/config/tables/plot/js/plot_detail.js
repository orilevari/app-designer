/**
 * The file for displaying a detail view.
 */
/* global $, odkTables, d3 */
'use strict';

// Handle the case where we are debugging in chrome.
// if (JSON.parse(odkCommon.getPlatformInfo()).container === 'Chrome') {
//     console.log('Welcome to Tables debugging in Chrome!');
//     $.ajax({
//         url: odkCommon.getFileAsUrl('output/debug/plot_data.json'),
//         async: false,  // do it first
//         success: function(dataObj) {
//             if (dataObj === undefined || dataObj === null) {
//                 console.log('Could not load data json for table: plot');
//             }
//             window.data.setBackingObject(dataObj);
//         }
//     });
// }

var plotDetailResultSet = {};
var visitData = {};
var plotId;

function visitCBSuccess(result) {
    visitData = result;

    display();
}

function visitCBFailure(error) {

    console.log('plot_detail: visitCBFailure failed with error: ' + error);
}

function cbSuccess(result) {
    
    plotDetailResultSet = result;

    plotId = plotDetailResultSet.getRowId(0); 

    odkData.query('visit', 'plot_id = ?', [plotId], null, null,
        null, null, true, visitCBSuccess, visitCBFailure);
}

function cbFailure(error) {

    console.log('plot_detail: cbFailure failed with error: ' + error);
}
 
function display() {
    // Perform your modification of the HTML page here and call display() in
    // the body of your .html file.
    
    var i;
    var plotId = plotDetailResultSet.getRowId(0);

    $('#NAME').text(plotDetailResultSet.get('plot_name'));
    $('#plot-id').text(plotId);
    $('#lat').text(plotDetailResultSet.get('location.latitude'));
    $('#long').text(plotDetailResultSet.get('location.longitude'));
    $('#crop').text(plotDetailResultSet.get('planting'));

// We want to get the count.
//     var table = odkTables.query(
//         'visit',
//         'plot_id = ?',
//         [plotId]);

    $('#visits').text(visitData.getCount());
    var margin = {top: 20, right: 20, bottom: 100, left: 60},
        width = 400 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Parse the date / time
    var	parseDate = d3.time.format("%Y-%m-%d").parse;

    var x = d3.scale.ordinal().rangeRoundBands([0, width], .05);

    var y = d3.scale.linear().range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(d3.time.format("%Y-%m-%d"));

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10);

    var xValues = visitData.getColumnData('date');
    var yValues = visitData.getColumnData('plant_height');


    var data = [];
    var i = 0;
    for (i = 0; i < xValues.length; i++) {
        var d = {};
        var fullDateString = xValues[i];
        var dateTimeSplit = fullDateString.split('T');
        if (dateTimeSplit[0] === null || dateTimeSplit[0] === undefined) {
            // Use default string
            d.date = "0001-01-01";
        } else {
            d.date = dateTimeSplit[0];
        }

        d.value = yValues[i];
        data.push(d);
    }

    data.forEach(function(d) {
        d.date = parseDate(d.date);
        d.value = +d.value;
    });
	
    x.domain(data.map(function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    var svg = d3.select("#graph-div").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "-.55em")
        .attr("transform", "rotate(-90)" );

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -100)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Height");

    svg.selectAll("bar")
        .data(data)
        .enter().append("rect")
        .style("fill", "steelblue")
        .attr("x", function(d) { return x(d.date); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.value); })
        .attr("height", function(d) { return height - y(d.value); });
}

function setup() {

    odkData.getViewData(cbSuccess, cbFailure);
}

