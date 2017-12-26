//Written by Kate Cotsakis, WFO CYS, 2017
/**
Takes the google forms urls and puts an edit form url into the sheet. 
**/
function assignEditUrls() {
    var form = FormApp.openById('');
    //enter form ID here
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Shift Notes');
    //Run for the Sheet called 'Shift Notes' only 
    
    var data = sheet.getDataRange().getValues(); //Returns the range of the spreadsheet
    var urlCol = 6; // column number where URL's should be populated; F=6
    var responses = form.getResponses(); //gets all the form responses
    var timestamps = [],
        urls = [],
        resultUrls = [];

    for (var i = 0; i < responses.length; i++) {
        timestamps.push(responses[i].getTimestamp().setMilliseconds(0));  //Creates an array with all the for responses urls.
        urls.push(responses[i].getEditResponseUrl());
    }
    for (var j = 1; j < data.length; j++) {

        resultUrls.push([data[j][0] ? urls[timestamps.indexOf(data[j][0].setMilliseconds(0))] : '']); //populates the columns with the url address
    }

    sheet.getRange(2, urlCol, resultUrls.length).setValues(resultUrls);
    for (var i = 0; i < data.length; i++) {
        var sheet_url = sheet.getRange(2 + i, 6).getValue();
        sheet.getRange(2 + i, 6).setFormula('=HYPERLINK(' + '"' + sheet_url + '"' + ';"Edit Form")'); //takes the url address and converts it to say 'Edit Form'
    }
    var date = new Date();
    var range = sheet.getRange(1, 8).setValue("Current As Of: " + date); //puts a date off the screen to test when it is running. optional.
}

//Script to delete old responses, to avoid having to many rows in the spreadsheet.
function Cleanup() { 
  var rowsToKeep = 500; //CHANGE TO YOUR DESIRED NUMBER OF ROWS TO KEEP
  var sheets = ['Shift Log' , 'Transmitter Log' , 'Tour Form']; //3 forms that are included on the sheet. The original form sheet that are being populated. 
  for(var i=0; i< sheets.length; i++){ //Go through each sheet and see how many rows there are, and delete if the rowsToKeep is met. 
    var sheets2 = sheets[i];
    var rows = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheets[i]).getLastRow();
    var numToDelete = rows  - rowsToKeep  -1; 
    if(numToDelete > 0){ 
      SpreadsheetApp.getActiveSheet().deleteRows(2, numToDelete); //deletes beginning at row 2 at the top 
    }
  }
} 