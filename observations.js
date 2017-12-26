//Developed by Kate Cotsakis, WFO Cheyenne, 2017
/**
This is designed to automatically pull in Mesowest data every 6 hours for the purpose of having an archived 6 hourly spreadsheet. 
5 different scripts are in this document. 1) sixhour 2) onOpen 3) newSheet 4) high 5) precip_accum

sixhour - writes in the high/low temps & precip every 6 hours, using .xml urls that are provided from mesowest. 
onOpen - this function is invoked whenever the spreadsheet is opened and adds a custom menu item. From there the sixhour and yesterdays highs can be rerun.
newSheet- this functions is set to run once a day around 2:30 am. This creates a copy of the sheet and archives it to another google spreadsheet. 
high - runs at 1am and looks at all of yesterday high temps and picks out the largest to put in the yesterdays highs column. 
precip_accum - This function calculates and keeps track of the monthly precip. It runs a 7Z and recalculated the monthly precip. 
               There is a bunch of checks it goes through to deal with missing and traces of precip.
**/
function sixhour() { 
    var moment = Moment.load(); //Moment Function for easier time stamps 
    // open the spreadsheet you want code written into
    var ss = SpreadsheetApp.openByUrl('');  //Spreadsheet URL
    var sheet = ss.getSheets()[0];
    var date = new Date(); //grab the current utc hour to seperate code into 6 hr segments
    var range = sheet.getRange(49, 18).setValue("Last Run 6 hr values: " + date);  //Add a timestamp to the bottom when the script runs
   //Time Variables for Script
   var utctime = date.getUTCHours();
    var coreHour = moment.utc();
    var strYear = coreHour.clone().format('YYYY');
    var month = coreHour.clone().get('month');
    var strMonth = coreHour.clone().format('MM');
    var strDate = coreHour.clone().format('DD');
    var strHour = coreHour.clone().format('HH');
    //Number of Sites that are in use
    var Number_sites = sheet.getRange(47, 21).getValue();

    for (var j = 0; j <= Number_sites; j++) { //Loop through number of sites
        var site = sheet.getRange(1, 3 + j).getValue();

        //Code for sites high temps
        var url = 'https://api.synopticlabs.org/v2/stations/latest?&token=fdb57affdf1f4909902eab37140fd76d&attime=' + coreHour.clone().format('YYYYMMDDHH') + '00&output=xml&units=temp%7Cf&stid=' + site + '&vars=air_temp_high_6_hour&within=150&hfmetars=0';
        var xml = UrlFetchApp.fetch(url).getContentText(); //Grab XML document and parse it up 
        var document = XmlService.parse(xml);

        var root = document.getRootElement();
        var none = root.getChild("SUMMARY").getChild("RESPONSE_MESSAGE").getValue();
         if(site == "KDWX"){ //DWX always reports an incorrect 6 hourly temp, only use ind. temp obs
                none = "No stations found for this request."; 
            }
        if (none == "No stations found for this request.") {
            //if there is no 6 hr group look at ind temps. 
            var url2 = 'https://api.synopticlabs.org/v2/stations/timeseries?&token=fdb57affdf1f4909902eab37140fd76d&units=temp%7Cf&output=xml&stid=' + site + '&vars=air_temp&recent=370';

            var xml = UrlFetchApp.fetch(url2).getContentText();
            var document = XmlService.parse(xml);
            var output = [];
            var root = document.getRootElement();
            var none = root.getChild("SUMMARY").getChild("RESPONSE_MESSAGE").getValue();

            if (none == "No stations found for this request.") { //If there is no 6 hr & no ind temps, report M.
                if (utctime >= 12 && utctime <= 17) {
                    var range3 = sheet.getRange(3, 3 + j);
                } else if (utctime >= 18 && utctime <= 23) {
                    var range3 = sheet.getRange(6, 3 + j);
                } else if (utctime >= 0 && utctime <= 5) {
                    var range3 = sheet.getRange(9, 3 + j);
                } else {
                    var range3 = sheet.getRange(12, 3 + j);
                }
                range3.setValue("M");

            } else { //Mainly for AWOS, if no 6 hour is reported use the ind 6 hour temps.
                var rowset = root.getChild("STATION").getChild("item").getChild("OBSERVATIONS").getChild("air_temp_set_1").getChildren();
                 //Runs through and gets all obs from the last 6 hours
                for (var i = 0; i < rowset.length; i++) {
                    var temps = rowset[i].getValue();
                    output.push([temps]);
                }
                output = output.filter(Number); //Filter out null obs

                if (output.length < 8) {  //If not enough obs are reported put in M, sites (except FEW) report every 5 to 15 minutes.
                                           // In order to correctly grab the high/low there must be at least 8 obs. 
                    if (utctime >= 12 && utctime <= 17) {
                        var range3 = sheet.getRange(3, 3 + j);
                        range3.setValue("M");
                    } else if (utctime >= 18 && utctime <= 23) {
                        var range3 = sheet.getRange(6, 3 + j);
                        range3.setValue("M");
                    } else if (utctime >= 0 && utctime <= 5) {
                        var range3 = sheet.getRange(9, 3 + j);
                        range3.setValue("M");
                    } else {
                        var range3 = sheet.getRange(12, 3 + j);
                        range3.setValue("M");
                    }
                } else {

                    output.sort(function(a, b) {
                        return b - a  //Sort obs to get high temp 
                    });

                    if (utctime >= 12 && utctime <= 17) {
                        var range = sheet.getRange(3, 3 + j);
                        range.setValue(output[0]);
                    } else if (utctime >= 18 && utctime <= 23) {
                        var range = sheet.getRange(6, 3 + j);
                        range.setValue(output[0]);
                    } else if (utctime >= 0 && utctime <= 5) {
                        var range = sheet.getRange(9, 3 + j);
                        range.setValue(output[0]);
                    } else {
                        var range = sheet.getRange(12, 3 + j);
                        range.setValue(output[0]);
                    }

                }

            }

        } else { //this statement is for the sites that do have a 6 hr group.
            var rowset = root.getChild("STATION").getChild("item").getChild("OBSERVATIONS").getChild("air_temp_high_6_hour_value_1").getChild("value").getValue();
            largestF = rowset; //Grab 6 hour group high temp if reported

            if (utctime >= 12 && utctime <= 17) {
                var range = sheet.getRange(3, 3 + j);
            } else if (utctime >= 18 && utctime <= 23) {
                var range = sheet.getRange(6, 3 + j);
            } else if (utctime >= 0 && utctime <= 5) {
                var range = sheet.getRange(9, 3 + j);
            } else {
                var range = sheet.getRange(12, 3 + j);
            }
            range.setValue(largestF);
        }

    } //close for loop for high temps (31)

    //code for sites low temps, similar to high temp code above.

    for (var j = 0; j <= Number_sites; j++) {
        var site = sheet.getRange(1, 3 + j).getValue();
        var url = 'https://api.synopticlabs.org/v2/stations/latest?&token=fdb57affdf1f4909902eab37140fd76d&attime=' + coreHour.clone().format('YYYYMMDDHH') + '00&output=xml&units=temp%7Cf&stid=' + site + '&vars=air_temp_low_6_hour&within=150&hfmetars=0';
        var xml = UrlFetchApp.fetch(url).getContentText();  //Grab XML document and parse it up
        var document = XmlService.parse(xml);

        var root = document.getRootElement();
        var none = root.getChild("SUMMARY").getChild("RESPONSE_MESSAGE").getValue();

        if(site == "KDWX"){ //DWX always reports an incorrect 6 hourly temp, only use ind. temp obs
                none = "No stations found for this request."; 
            }
            
        if (none == "No stations found for this request.") {
            //if there is no 6 hr group look at ind temps. 
            var url2 = 'https://api.synopticlabs.org/v2/stations/timeseries?&token=fdb57affdf1f4909902eab37140fd76d&units=temp%7Cf&output=xml&stid=' + site + '&vars=air_temp&recent=370';
            var xml = UrlFetchApp.fetch(url2).getContentText();
            var document = XmlService.parse(xml);
            var output = [];
            var root = document.getRootElement();
            var none = root.getChild("SUMMARY").getChild("RESPONSE_MESSAGE").getValue();
           
            if (none == "No stations found for this request.") {  //If no station obs are found report M
                if (utctime >= 12 && utctime <= 17) {
                    var range3 = sheet.getRange(4, 3 + j);
                } else if (utctime >= 18 && utctime <= 23) {
                    var range3 = sheet.getRange(7, 3 + j);
                } else if (utctime >= 0 && utctime <= 5) {
                    var range3 = sheet.getRange(10, 3 + j);
                } else {
                    var range3 = sheet.getRange(13, 3 + j);
                }
                range3.setValue("M");

            } else {
                var rowset = root.getChild("STATION").getChild("item").getChild("OBSERVATIONS").getChild("air_temp_set_1").getChildren();
                 //Runs through and gets all obs from the last 6 hours
                for (var i = 0; i < rowset.length; i++) {
                    var temps = rowset[i].getValue();
                    output.push([temps]);
                }
                output = output.filter(Number);  //Remove null obs

                if (output.length < 8) {  //If not enough obs are reported put in M

                    if (utctime >= 12 && utctime <= 17) {
                        var range3 = sheet.getRange(4, 3 + j);
                        range3.setValue("M");
                    } else if (utctime >= 18 && utctime <= 23) {
                        var range3 = sheet.getRange(7, 3 + j);
                        range3.setValue("M");
                    } else if (utctime >= 0 && utctime <= 5) {
                        var range3 = sheet.getRange(10, 3 + j);
                        range3.setValue("M");
                    } else {
                        var range3 = sheet.getRange(13, 3 + j);
                        range3.setValue("M");
                    }
                } else {

                    output.sort(function(a, b) {
                        return a - b  //Sort array to get smallest ob
                    });

                    if (utctime >= 12 && utctime <= 17) {
                        var range = sheet.getRange(4, 3 + j);
                        range.setValue(output[0]);
                    } else if (utctime >= 18 && utctime <= 23) {
                        var range = sheet.getRange(7, 3 + j);
                        range.setValue(output[0]);
                    } else if (utctime >= 0 && utctime <= 5) {
                        var range = sheet.getRange(10, 3 + j);
                        range.setValue(output[0]);
                    } else {
                        var range = sheet.getRange(13, 3 + j);
                        range.setValue(output[0]);
                    }

                }

            }

        } else {
            var rowset = root.getChild("STATION").getChild("item").getChild("OBSERVATIONS").getChild("air_temp_low_6_hour_value_1").getChild("value").getValue();
            smallestF = rowset;  //If a 6 hour group is reported use that

            if (utctime >= 12 && utctime <= 17) {
                var range1 = sheet.getRange(4, 3 + j);
            } else if (utctime >= 18 && utctime <= 23) {
                var range1 = sheet.getRange(7, 3 + j);
            } else if (utctime >= 0 && utctime <= 5) {
                var range1 = sheet.getRange(10, 3 + j);
            } else {
                var range1 = sheet.getRange(13, 3 + j);
            }
            range1.setValue(smallestF);
        }
    } //close for loop for low temps (134)

    //code for asos sites precip 6 hour  
      //AWOS will still go through this loop but will always have 0 (shows up on spreadsheet as invisible i.e. white text & background)
    for (var j = 0; j <= Number_sites; j++) {
        var site = sheet.getRange(1, 3 + j).getValue();
        var url = 'https://api.synopticlabs.org/v2/stations/nearesttime?&token=fdb57affdf1f4909902eab37140fd76d&output=xml&units=precip%7Cin&stid=' + site + '&vars=precip_accum_six_hour&within=360&hfmetars=0';
        var xml = UrlFetchApp.fetch(url).getContentText(); //Grab XML document and parse it up for precip xml
        var document = XmlService.parse(xml);

        var root = document.getRootElement();
        var none = root.getChild("SUMMARY").getChild("RESPONSE_MESSAGE").getValue();
        //find the present weather groups for the past 6 hrs
        var url2 = 'https://api.synopticlabs.org/v2/stations/timeseries?&token=fdb57affdf1f4909902eab37140fd76d&output=xml&recent=370&stid=' + site + '&vars=weather_condition';
        var xml_weather = UrlFetchApp.fetch(url2).getContentText(); //Grab XML document and parse it up for weather xml
        var document = XmlService.parse(xml_weather);
        
        var output_weather = [];
        var root_weather = document.getRootElement();
        var none_weather = root_weather.getChild("SUMMARY").getChild("RESPONSE_MESSAGE").getValue();
        
        //if weather xml doc can't be found skip to the end
        if (none_weather !== "No stations found for this request.") { //if the weather xml is found run through the if statement here.
            var rowset_weather = root_weather.getChild("STATION").getChild("item").getChild("OBSERVATIONS").getChild("weather_condition_set_1d").getChildren();
            for (var i = 0; i < rowset_weather.length; i++) {
                var weather = rowset_weather[i].getValue();
                output_weather.push([weather]);
            }
            output_weather.sort();
            var string_weather = output_weather.toString(); //change array to string to search output_weather
            //search through all the weather groups to find if there was a precipitation type
            //if the value is -1 that means the string was not found. 
            //if # > -1, that is the location in the array of the 1st instance that string is found. 
            var search_weather = string_weather.indexOf('Rain');
            var search_weather2 = string_weather.indexOf('Snow');
            var search_weather3 = string_weather.indexOf('Drizzle');
            var search_weather4 = string_weather.indexOf('Overcast');
            var search_weather5 = string_weather.indexOf('Unknown');
            var search_weather6 = string_weather.indexOf('Fog');
            var search_weather7 = string_weather.indexOf('Cloudy');
            var search_weather8 = string_weather.indexOf('Thunder');

            if (none == "No stations found for this request.") { //statement is no precip is found.
                for (var i = 0; i < output_weather.length; i++) {

                    if (search_weather !== -1 || search_weather2 !== -1 || search_weather3 !== -1 || search_weather5 !== -1) {
                        //Code mainly for FEW & IBM, if present weather is found, but no accumulated precip is recorded
                        if (utctime >= 12 && utctime <= 17) {
                            var range2 = sheet.getRange(5, 3 + j);
                            range2.setValue("0.001"); {
                                break;
                            } //close the break
                        } else if (utctime >= 18 && utctime <= 23) {
                            var range2 = sheet.getRange(8, 3 + j);
                            range2.setValue("0.001"); {
                                break;
                            } //close the break
                        } else if (utctime >= 0 && utctime <= 5) {
                            var range2 = sheet.getRange(11, 3 + j);
                            range2.setValue("0.001"); {
                                break;
                            } //close the break
                        } else {
                            var range2 = sheet.getRange(14, 3 + j);
                            range2.setValue("0.001"); {
                                break;
                            } //close the break
                        } //close of else (292)
                    } //close of if (275)
                    else { //If the present wx is not found listed above & no precip is recorded the value must be 0.
                        if (utctime >= 12 && utctime <= 17) {
                            var range2 = sheet.getRange(5, 3 + j);
                        } else if (utctime >= 18 && utctime <= 23) {
                            var range2 = sheet.getRange(8, 3 + j);
                        } else if (utctime >= 0 && utctime <= 5) {
                            var range2 = sheet.getRange(11, 3 + j);
                        } else {
                            var range2 = sheet.getRange(14, 3 + j);
                        }
                        range2.setValue("0.00");
                    } // close of else (298)
                } //close of for loop (273)
            } //close of if statement (272)
            else { //Statement is precip is found.
                var rowset = root.getChild("STATION").getChild("item").getChild("OBSERVATIONS").getChild("precip_accum_six_hour_value_1").getChild("value").getValue();
                for (var i = 0; i < output_weather.length; i++) {
                    //If weather is found, use the accumulated precipitation. Need to find which weather type is present.(-1 is reported if none is found)
                    if (search_weather !== -1 || search_weather2 !== -1 || search_weather3 !== -1 || search_weather4 !== -1 || search_weather5 !== -1 || search_weather6 !== -1 || search_weather7 !== -1 || search_weather8 !== -1) {
                          //If any weather/clouds are found use the weather type
                        if (utctime >= 12 && utctime <= 17) {
                            var range2 = sheet.getRange(5, 3 + j);
                            range2.setValue(rowset); {
                                break;
                            } //close the break
                        } else if (utctime >= 18 && utctime <= 23) {
                            var range2 = sheet.getRange(8, 3 + j);
                            range2.setValue(rowset); {
                                break;
                            } //close the break
                        } else if (utctime >= 0 && utctime <= 5) {
                            var range2 = sheet.getRange(11, 3 + j);
                            range2.setValue(rowset); {
                                break;
                            } //close the break
                        } else {
                            var range2 = sheet.getRange(14, 3 + j);
                            range2.setValue(rowset); {
                                break;
                            } //close the break
                        } //close for else statement (332)
                    } //close for if statement (315)

                    // If no precipitation type is recorded put in a false trace
                    else {
                        if (utctime >= 12 && utctime <= 17) {
                            var range2 = sheet.getRange(5, 3 + j);
                        } else if (utctime >= 18 && utctime <= 23) {
                            var range2 = sheet.getRange(8, 3 + j);
                        } else if (utctime >= 0 && utctime <= 5) {
                            var range2 = sheet.getRange(11, 3 + j);
                        } else {
                            var range2 = sheet.getRange(14, 3 + j);
                        }
                        range2.setValue("F(T)");
                    } //close the else statement (341)
                } //close the for loop (313)
            } //close the else statement (311)
        } //close the if statement (254)
        else { //If the present weather XML doc can't be found, just use the values or zero. 
            if (none == "No stations found for this request.") { //No precip is found = zero

                if (utctime >= 12 && utctime <= 17) {
                    var range2 = sheet.getRange(5, 3 + j);
                } else if (utctime >= 18 && utctime <= 23) {
                    var range2 = sheet.getRange(8, 3 + j);
                } else if (utctime >= 0 && utctime <= 5) {
                    var range2 = sheet.getRange(11, 3 + j);
                } else {
                    var range2 = sheet.getRange(14, 3 + j);
                }
                range2.setValue("0.00");
            } else { //precip is found, use the value in the xml doc.
                var rowset = root.getChild("STATION").getChild("item").getChild("OBSERVATIONS").getChild("precip_accum_six_hour_value_1").getChild("value").getValue();

                if (utctime >= 12 && utctime <= 17) {
                    var range2 = sheet.getRange(5, 3 + j);
                    range2.setValue(rowset); {
                        break;
                    } //close the break
                } else if (utctime >= 18 && utctime <= 23) {
                    var range2 = sheet.getRange(8, 3 + j);
                    range2.setValue(rowset); {
                        break;
                    } //close the break

                } else if (utctime >= 0 && utctime <= 5) {
                    var range2 = sheet.getRange(11, 3 + j);
                    range2.setValue(rowset); {
                        break;
                    } //close the break
                } else {
                    var range2 = sheet.getRange(14, 3 + j);
                    range2.setValue(rowset); {
                        break;
                    } //close the break
                } //close the else (387)
            } //close the else statment (368)
        } //close the else statement (355)
    } //close the for precip loop (236)
} //close the function sixhour


//This function creates a custom menu item on the spreadsheet in order to rerun the values for sixhour and yesterday highs.
function onOpen() {
    var menu = SpreadsheetApp.getUi().createMenu('Rerun Values');
    menu.addItem('6 Hourly Values', 'sixhour');
    menu.addItem('Yesterday Highs', 'high');
    menu.addToUi();
}


//function the copies code to a new spreadsheet at the end of the day to archive
function newSheet() {
    var MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
    var now = new Date();
    var name = new Date(now.getTime() - MILLIS_PER_DAY).toLocaleDateString();
    var Delete_Sheet = new Date(now.getTime() - MILLIS_PER_DAY * 199).toLocaleDateString()

    //Original Sheet Location
    var source = SpreadsheetApp.openByUrl(""); //This is the RTP observation spreadsheet location
    var sourcename = source.getSheetName(); //get the sheet we want copied sheet1
    var sValues = source.getDataRange().getValues(); //These are all the styles we want copied over the the destination sheet. 
    var sBG = source.getDataRange().getBackgrounds();
    var sFC = source.getDataRange().getFontColors();
    var sFF = source.getDataRange().getFontFamilies();
    var sFL = source.getDataRange().getFontLines();
    var sFFa = source.getDataRange().getFontFamilies();
    var sFSz = source.getDataRange().getFontSizes();
    var sFSt = source.getDataRange().getFontStyles();
    var sFW = source.getDataRange().getFontWeights();
    var sHA = source.getDataRange().getHorizontalAlignments();
    var sVA = source.getDataRange().getVerticalAlignments();
    var sNF = source.getDataRange().getNumberFormats();
    var sWR = source.getDataRange().getWraps();
    //Destination Location
    var destination = SpreadsheetApp.openByUrl(""); //This is the Daily obs data speadsheet location
    var destinationSheet = destination.insertSheet(name, 0); //insert a sheet into the spreadsheet with the name of yesterdays date.
    destinationSheet.getRange(1, 1, sValues.length, sValues[0].length).setValues(sValues) //set the styles and copy over the information.
        .setBackgrounds(sBG)
        .setFontColors(sFC)
        .setFontFamilies(sFF)
        .setFontLines(sFL)
        .setFontFamilies(sFFa)
        .setFontSizes(sFSz)
        .setFontStyles(sFSt)
        .setFontWeights(sFW)
        .setHorizontalAlignments(sHA)
        .setVerticalAlignments(sVA)
        .setNumberFormats(sNF)
        .setWraps(sWR);

}

function high() {
    var ss = SpreadsheetApp.openByUrl(''); //spreadsheet we are writing to
    var sheet = ss.getSheets()[0]; //sheet we want to write to sheet1
    var output = [] 
    for (var i = 0; i < 15; i++) {
        var twelve_high = sheet.getRange(3, 3 + i).getValue();  //grab the values for high temps for each run of the day
        var eightteen_high = sheet.getRange(6, 3 + i).getValue();
        var zero_high = sheet.getRange(9, 3 + i).getValue();
        var six_high = sheet.getRange(12, 3 + i).getValue();
        if (twelve_high == "M") { //If any of the values come across as M set the value to a number, so the array is all numbers. 
            twelve_high = 1000;
        }
        if (eightteen_high == "M") {
            eightteen_high = 1000;
        }
        if (zero_high == "M") {
            zero_high = 1000;
        }
        if (six_high == "M") {
            six_high = 1000;
        }
        output = [twelve_high, eightteen_high, zero_high, six_high];
        output.sort(function(a, b) { //sort the numbers to find the highest
            return b - a
        });
        if (output[0] == 1000) { // if the highest number that comes across is 1000, set it as M.
            output[0] = "M";
        }
        var range = sheet.getRange(15, 3 + i).setValue(output[0]); //append the yesterday's high row 


    }
}

function precip_accum() {
    // open the spreadsheet you want code written into
    var ss = SpreadsheetApp.openByUrl('');
    var sheet = ss.getSheets()[0]; // This is the sheet we want to write to (sheet 1)

    var get_range = sheet.getRange(16, 2);
    var data = get_range.getValue();
    var d = new Date();
    var range = sheet.getRange(50, 18).setValue("Last Run Precip Accum: " + d);
    var utctime = d.getUTCHours();
    var day = d.getDate(); 
    var timeZone = d.getTimezoneOffset();
    var month = new Array();
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";
    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";
    var n = month[d.getMonth()]; // grab which month it currently is.

    var range = sheet.getRange(16, 2); //This is the month location in the spreadsheet.

    for (var i = 0; i < 11; i++) {
        var monthly_precip = sheet.getRange(16, 3 + i).getValue(); // Get the values in the sheet for each precip cell we need. 
        var precip1 = sheet.getRange(5, 3 + i).getValue();
        var precip2 = sheet.getRange(8, 3 + i).getValue();
        var precip3 = sheet.getRange(11, 3 + i).getValue();
        var precip4 = sheet.getRange(14, 3 + i).getValue();
        
        if (data == n) {  //This is the if statement most of the time that will be used. 

            if (precip1 == "M") {  //If there is missing precip, count it as zero
                precip1 = 0;
            }
            if (precip2 == "M") {
                precip2 = 0;
            }
            if (precip3 == "M") {
                precip3 = 0;
            }
            if (precip4 == "M") {
                precip4 = 0;
            }
            if (precip1 == "F(T)") {   //if there is a false trace, count it as zero
                precip1 = 0;
            }
            if (precip2 == "F(T)") {
                precip2 = 0;
            }
            if (precip3 == "F(T)") {
                precip3 = 0;
            }
            if (precip4 == "F(T)") {
                precip4 = 0;
            }
            if (precip1 == 0.001 && monthly_precip > 0) {   //if the current monthly precip is greater then zero, count all traces as zero (negligible)
                precip1 = 0;
            }
            if (precip2 == 0.001 && monthly_precip > 0) {
                precip2 = 0;
            }
            if (precip3 == 0.001 && monthly_precip > 0) {
                precip3 = 0;
            }
            if (precip4 == 0.001 && monthly_precip > 0) {
                precip4 = 0;
            }
            if (precip1 == 0.001 && precip2 + precip3 + precip4 > 0) {   //if one cell is only a trace, but any of the others are larger, use the largest value present. 
                precip1 = 0;
            }
            if (precip2 == 0.001 && precip1 + precip3 + precip4 > 0) {
                precip2 = 0;
            }
            if (precip3 == 0.001 && precip1 + precip2 + precip4 > 0) {
                precip3 = 0;
            }
            if (precip4 == 0.001 && precip2 + precip3 + precip1 > 0) {
                precip4 = 0;
            }
            if (precip1 >= 0.01 && monthly_precip == 0.001) {  //if the monthly precip is a trace, and there is a cell that is larger then a trace wipe out the trace amount. 
                monthly_precip = 0;
            }
            if (precip2 >= 0.01 && monthly_precip == 0.001) {
                monthly_precip = 0;
            }
            if (precip3 >= 0.01 && monthly_precip == 0.001) {
                monthly_precip = 0;
            }
            if (precip4 >= 0.01 && monthly_precip == 0.001) {
                monthly_precip = 0;
            }
            var new_month = precip1 + precip2 + precip3 + precip4 + monthly_precip;  //Adds up the new monthly precip with the checks above finished. 

            var new_range = sheet.getRange(16, 3 + i);
            new_range.setValue(new_month);  //appends the new value to the sheet. 

        } else if (day == 1.0) {  //This takes into account the script is running at 2:30am (technically the next day) but still the last months precip data. 
            if (precip1 == "M") {
                precip1 = 0;
            }
            if (precip2 == "M") {
                precip2 = 0;
            }
            if (precip3 == "M") {
                precip3 = 0;
            }
            if (precip4 == "M") {
                precip4 = 0;
            }
            if (precip1 == "F(T)") {
                precip1 = 0;
            }
            if (precip2 == "F(T)") {
                precip2 = 0;
            }
            if (precip3 == "F(T)") {
                precip3 = 0;
            }
            if (precip4 == "F(T)") {
                precip4 = 0;
            }
            if (precip1 == 0.001 && monthly_precip > 0) {
                precip1 = 0;
            }
            if (precip2 == 0.001 && monthly_precip > 0) {
                precip2 = 0;
            }
            if (precip3 == 0.001 && monthly_precip > 0) {
                precip3 = 0;
            }
            if (precip4 == 0.001 && monthly_precip > 0) {
                precip4 = 0;
            }
            if (precip1 == 0.001 && precip2 + precip3 + precip4 > 0) {
                precip1 = 0;
            }
            if (precip2 == 0.001 && precip1 + precip3 + precip4 > 0) {
                precip2 = 0;
            }
            if (precip3 == 0.001 && precip1 + precip2 + precip4 > 0) {
                precip3 = 0;
            }
            if (precip4 == 0.001 && precip2 + precip3 + precip1 > 0) {
                precip4 = 0;
            }
            if (precip1 >= 0.01 && monthly_precip == 0.001) {
                monthly_precip = 0;
            }
            if (precip2 >= 0.01 && monthly_precip == 0.001) {
                monthly_precip = 0;
            }
            if (precip3 >= 0.01 && monthly_precip == 0.001) {
                monthly_precip = 0;
            }
            if (precip4 >= 0.01 && monthly_precip == 0.001) {
                monthly_precip = 0;
            }
            var new_month = precip1 + precip2 + precip3 + precip4 + monthly_precip;

            var new_range = sheet.getRange(16, 3 + i);
            new_range.setValue(new_month);
        }
        
        else {  //This else statement is to take into account a new month. This will run on day 2 of the new month, with day 1 data. 
            range.setValue(n);
            var new_month = sheet.getRange(16, 3 + i).setValue(0.0);  //resets the monthly total to zero.
            var monthly_precip = sheet.getRange(16, 3 + i).getValue(); //grabs the number 0.0 to begin running the checks.

            if (precip1 == "M") {
                precip1 = 0;
            }
            if (precip2 == "M") {
                precip2 = 0;
            }
            if (precip3 == "M") {
                precip3 = 0;
            }
            if (precip4 == "M") {
                precip4 = 0;
            }
            if (precip1 == "F(T)") {
                precip1 = 0;
            }
            if (precip2 == "F(T)") {
                precip2 = 0;
            }
            if (precip3 == "F(T)") {
                precip3 = 0;
            }
            if (precip4 == "F(T)") {
                precip4 = 0;
            }
            if (precip1 == 0.001 && monthly_precip > 0) {
                precip1 = 0;
            }
            if (precip2 == 0.001 && monthly_precip > 0) {
                precip2 = 0;
            }
            if (precip3 == 0.001 && monthly_precip > 0) {
                precip3 = 0;
            }
            if (precip4 == 0.001 && monthly_precip > 0) {
                precip4 = 0;
            }
            if (precip1 == 0.001 && precip2 + precip3 + precip4 > 0) {
                precip1 = 0;
            }
            if (precip2 == 0.001 && precip1 + precip3 + precip4 > 0) {
                precip2 = 0;
            }
            if (precip3 == 0.001 && precip1 + precip2 + precip4 > 0) {
                precip3 = 0;
            }
            if (precip4 == 0.001 && precip2 + precip3 + precip1 > 0) {
                precip4 = 0;
            }
            if (precip1 >= 0.01 && monthly_precip == 0.001) {
                monthly_precip = 0;
            }
            if (precip2 >= 0.01 && monthly_precip == 0.001) {
                monthly_precip = 0;
            }
            if (precip3 >= 0.01 && monthly_precip == 0.001) {
                monthly_precip = 0;
            }
            if (precip4 >= 0.01 && monthly_precip == 0.001) {
                monthly_precip = 0;
            }


            var new_month = precip1 + precip2 + precip3 + precip4 + monthly_precip; //calculates the new monthly precip. 

            var new_range = sheet.getRange(16, 3 + i);
            new_range.setValue(new_month); //appends the new value to the sheet. 
        }

    }
}