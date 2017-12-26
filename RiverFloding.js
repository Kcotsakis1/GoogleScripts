//Developed by Kate Cotsakis, WFO CYS 2017
/**
Code grabs .xml links provided by the rfc's, parses up the document and pulls out relavent information. 
If no forecast is issued nothing will show up on the spreadsheet. 
**/
function rivers() {
    //Pulls in Spreadsheet that you want used.
    var ss = SpreadsheetApp.openByUrl("");  //Spreadsheet URL
    var sheet = ss.getSheets()[0]; // Grabs the active sheet (Sheet 1) 

    ///url's of the xml files for each river point
    var url = ['https://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=lsdw4&output=xml', 'https://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=hanw4&output=xml', 'https://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=ecrw4&output=xml',
        'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=sraw4&output=xml', 'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=sinw4&output=xml', 'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=glnw4&output=xml',
        'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=oriw4&output=xml', 'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=henn1&output=xml', 'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=micn1&output=xml',
        'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=mntn1&output=xml', 'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=bgpn1&output=xml', 'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=flaw4&output=xml',
        'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=bosw4&output=xml', 'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=llrw4&output=xml', 'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=wodw4&output=xml',
        'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=smcw4&output=xml', 'http://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=feww4&output=xml',
    ];
    //loop that goes through each xml file to get the info
    for (var j = 0; j < url.length; j++) {
        var xml = UrlFetchApp.fetch(url[j]).getContentText();
        var document = XmlService.parse(xml);
        var output = [];
        var root = document.getRootElement();
        var sigstages_string = root.getChild("sigstages").getChild("action").getValue(); //action stage
        var sigstages = Number(sigstages_string);
        var minor_string = root.getChild("sigstages").getChild("flood").getValue(); //minor flooding stage
        var minor = Number(minor_string);
        var mod_string = root.getChild("sigstages").getChild("moderate").getValue(); //moderate flooding stage
        var mod = Number(mod_string);
        var major_string = root.getChild("sigstages").getChild("major").getValue(); //major flooding stage
        var major = Number(major_string);
        var obs = root.getChild("observed").getChild("datum").getChild("primary").getValue(); //grabs most current ob
        var fyi = root.getChild("forecast").getValue(); // looks to see if a forecast is avaiable
        if (fyi == "There Is No Displayable Forecast Data In The Given Time Frame") { //if no forecast skip to the end
            stage = 'Forecast Not Available'
            var range = sheet.getRange(2 + j, 3);
            range.setValue(stage);

            var timerangeClear = sheet.getRange(2 + j, 2).clear();
            var forecastClear = sheet.getRange(2 + j, 4).clear();
        } else {

            var rowset = root.getChild("forecast").getChildren(); // if there is a forecast
            for (var i = 0; i < rowset.length; i++) { // grab all forecast data points

                var forecast = rowset[i].getChild("primary").getValue();
                output.push([forecast]);
            }
            if (output.length > 15) { // if not enough forecast points available skip to the end
                var sort = [];
                sort = output.sort();
                var large = output[15]; // sorts the forecast points and grabs the largest
                var large1 = large.toString();
                var largest = Number(large1);

                var forecastRange = sheet.getRange(2 + j, 4)
                forecastRange.setValue(large1);

                var time = root.getChild("forecast").getAttribute("issued").getValue(); // grabs the most current forecast time
                var timerange = sheet.getRange(2 + j, 2);
                timerange.setValue(time);

                if (major != 0 && largest > major) { // sorts into categories based on forecasted river height
                    var stage = 'flw - Flood Stage Major';
                    var range = sheet.getRange(2 + j, 3);
                    range.setValue(stage);
                } else if (mod != 0 && largest > mod) {
                    var stage = 'flw - Flood Stage Moderate';
                    var range = sheet.getRange(2 + j, 3);
                    range.setValue(stage);
                } else if (largest >= minor) {
                    stage = 'flw - Flood Stage Minor';
                    var range = sheet.getRange(2 + j, 3);
                    range.setValue(stage);
                } else if (largest >= sigstages) {
                    var stage = 'rvs - Action Stage';
                    var range = sheet.getRange(2 + j, 3);
                    range.setValue(stage);
                } else {
                    stage = 'none'
                    var range = sheet.getRange(2 + j, 3);
                    range.setValue(stage);
                }
            } else { //if not enough forecast data points, display not available. 
                stage = 'Forecast Not Available'
                var range = sheet.getRange(2 + j, 3);
                range.setValue(stage);
                timerangeClear = sheet.getRange(2 + j, 2).clear();
                forecastClear = sheet.getRange(2 + j, 4).clear();
            }
        }
        var floodrange = sheet.getRange(2 + j, 5); //display flood level
        floodrange.setValue(minor);
        var obrange = sheet.getRange(2 + j, 6); //displays the latest ob
        obrange.setValue(obs);
    }
}