//Developed by Kate Cotsakis, Cheyenne WFO
/////////////////////////
//These functions take the Daily Obs Data spreadsheet and exports it to the Google Drive
// folder (RTP Obs) that is held by the NWS Cheyenne account and all employees have access too. 
// at the beginnning of the next month the sheets will be exported and the old month will be deleted. 
/////////////////////////
function getGoogleSpreadsheetAsExcel() {
    try {
        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getYear();
        var yesterday = new Date(Date.now() - 864e5);
        var last_month = yesterday.getMonth();
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
        var n = month[yesterday.getMonth()]; //gets yesterdays month.
        var title = n + " " + year; //title of the document when it is exported month & year i.e. August 2017
        var ss = SpreadsheetApp.openByUrl('');  //Spreadsheet url
        //Do not modify needed for exporting
        var url = "https://docs.google.com/feeds/download/spreadsheets/Export?key=" + ss.getId() + "&exportFormat=xlsx";

        var params = {
            method: "get",
            headers: {
                "Authorization": "Bearer " + ScriptApp.getOAuthToken()
            },
            muteHttpExceptions: true
        };

        var blob = UrlFetchApp.fetch(url, params).getBlob();

        blob.setName(title + ".xlsx"); // sets the new file name

        var folder = DriveApp.getFolderById(""); //id of RTP obs Google Drive folder. 
        folder.createFile(blob); //writes the new excel file to the RTP obs folder.
        
        if (day == 1) { //If this is the 1st day of the new month, delete the old months sheets.
            var deleteSheetsContaining = n;
            var sheetsCount = ss.getSheets();
            for (var i = 0; i < sheetsCount.length; i++) {
                var sheet = sheetsCount[i];
                var sheetName = sheet.getSheetName();
                Logger.log(sheetName);
                if (sheetName.indexOf(deleteSheetsContaining.toString()) !== -1) {
                    ss.deleteSheet(sheet);
                }
            }
        }

    } catch (f) {
        Logger.log(f.toString());
    }
}
//Adds a custom menu tp the active spreadsheet that contains the function if it needs to be run manually. 
function onOpen() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var xlsxMenuEntries = [{
        name: "export as xlsx files",
        functionName: "getGoogleSpreadsheetAsExcel"
    }];
    ss.addMenu("Export", xlsxMenuEntries);
};