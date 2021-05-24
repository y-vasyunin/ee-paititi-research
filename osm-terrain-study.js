// #############################################################################
// ### 0 NOTES ###
// #############################################################################

/* Load custom points, calculate terrain-related statistics for them,
and export the results as a CSV table. */

// #############################################################################
// ### 1 INPUT VARIABLES ###
// #############################################################################

// data
var dem = ee.Image("USGS/SRTMGL1_003");
var landforms = ee.Image("CSP/ERGo/1_0/Global/SRTM_landforms");

// area
//var points = ee.FeatureCollection("users/jarickkk/paititi/osm_places");
var points = ee.FeatureCollection("users/jarickkk/paititi/osm_inca_sites");

// styling and display
var bufVis = {color: "red"};

// misc
var gsd = 30;  // scale in meters, used by reducers
var bufSize = 50;  // buffer radius in meters, for input points
// var columns = ["osm_id", "name", "place"];  // keep these attribute fields
var columns = ["fid", "name", "historic_c"];  // keep these attribute fields


// Export-specific parameters
var printChart = true;
var doExport = true;  // export file after calculation
var exportPath = "EarthEngine";  // Google Drive folder


// #############################################################################
// ### 2 FUNCTIONS ###
// #############################################################################

var makeBuffer = function(f) {
  return f.buffer(bufSize);
};

// #############################################################################
// ### 3 PROCESSING ###
// #############################################################################

var points = points.select(columns);
var buf = points.map(makeBuffer);
var tProducts = ee.Terrain.products(dem);
var slope = tProducts.select("slope");

var bufMean = slope.reduceRegions({
  collection: buf,
  reducer: ee.Reducer.mean(),
  scale: 30
});

var bufMedian = slope.reduceRegions({
  collection: bufMean,
  reducer: ee.Reducer.median(),
  scale: 30
});

var bufStdDev = slope.reduceRegions({
  collection: bufMedian,
  reducer: ee.Reducer.stdDev(),
  scale: 30
});

var bufLandforms = landforms.reduceRegions({
  collection: bufStdDev,
  reducer: ee.Reducer.mode(),
  scale: 30
});


// var bufFinal = bufLandforms.map(getLandform);
var bufFinal = bufLandforms;

// #############################################################################
// ### 4 VISUALIZATION ###
// #############################################################################

// console
print(bufFinal.first());

// ui
if (printChart) {
  var chart =
    ui.Chart.feature
        .histogram({features: bufFinal,
        property: "median",
        maxBuckets: 10})
        .setOptions({
//          title: "Median Slope Angle for Small Andean Settlements, 15738 samples",
          title: "Median Slope Angle for Inca Archaeological Sites, 59 Samples",
          hAxis: {
            title: "Slope, in degrees",
            titleTextStyle: {italic: false, bold: true}
          },
          vAxis: {
            title: "Sample count",
            titleTextStyle: {italic: false, bold: true}
          },
          colors: ['1d6b99'],
          legend: {position: 'none'}
        });
  print(chart);
} else {
  print("Chart is deactivated");
}

// map
Map.centerObject(points, 11);
Map.addLayer(dem, {}, "DEM", false);
Map.addLayer(landforms, {}, "Landforms", false);
Map.addLayer(bufLandforms, bufVis, "Andean Settlements", true, 0.7);

// Export

var d = new Date();
var expDate = [
  d.getFullYear(),
  ("0" + (d.getMonth()+1)).slice(-2),
  ("0" + d.getDate()).slice(-2)].join("-");
var expTime = [
  ("0" + d.getHours()).slice(-2),
  ("0" + d.getMinutes()).slice(-2),
  ("0" + d.getSeconds()).slice(-2),
  ("00" + d.getMilliseconds()).slice(-3)].join("-");

//var filename = [expDate, expTime, "AndeanVillages"].join("_");
var filename = [expDate, expTime, "IncaRuins"].join("_");


if (doExport) {
  Export.table.toDrive({
    collection: bufLandforms,
    description: filename,
    selectors: columns,
    folder: exportPath,
    fileFormat: "CSV"
  });
} else {
  print("export to Gdrive is deactivated");
}
