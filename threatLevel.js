/* developed by Kate Cotsakis - WFO CYS, 2017
This code has 2 parts, email and cleanup
the function emailStuff is currently inactive, but with configuration can be used to send out emails
when the threat level has been changed.
The second functions Cleanup() is used to delete responses when the total is above 40. This keeps
the number of responses to a reasonable level. The trigger is set up to run at the 1st of the month. 
*/
function emailStuff(e){
  
 var sheetName = "Current Threat Level";
  
 var ss = SpreadsheetApp.getActiveSpreadsheet();
 var sheet = ss.getSheetByName(sheetName);
     
      var email = "";  //Person you want the email sent to.
      var subject = "Current Readiness Level";  //Subject of the email, text that is in cell Al "Current Threat Level"
      var level = sheet.getRange("B1").getValue();
      var body = "The current readiness level has been changed to: " + level; //Text in the body of the email, "The current threat level has been changed to: Level 4"

      MailApp.sendEmail(email, subject, body); //Send Email
  
}

function Cleanup() { 
  var rowsToKeep = 40; //CHANGE TO YOUR DESIRED NUMBER OF ROWS TO KEEP
  var sheets = ['Threat Level Responses']; // forms that are included on the sheet. The original form sheet that are being populated. 
  for(var i=0; i< sheets.length; i++){ //Go through each sheet and see how many rows there are, and delete if the rowsToKeep is met. 
    var sheets2 = sheets[i];
    var rows = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheets[i]).getLastRow();
    var numToDelete = rows  - rowsToKeep  -1; 
    if(numToDelete > 0){ 
      SpreadsheetApp.getActiveSheet().deleteRows(2, numToDelete); //deletes beginning at row 2 at the top 
    }
  }
} 