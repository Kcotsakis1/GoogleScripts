//Written By Kate Cotsakis, WFO CYS
/////////////////////////////////////
// Script that takes the input from the Peak leave google form and 
// puts it on the peak leave calendar
/////////////////////////////////////
var moment = Moment.load(); //Load the Moment.js library
   
var GLOBAL = {
  //the id of the form we will use to create calendar events 
  formId : "",  //Form ID
  
  //the id of the calendar we will create events on
  calendarId : "",  //Calendar URL
  
  //a mapping of form item titles to sections of the calendar event
  formMap : {
    eventTitle: "First and Last Name",
    startTime : "Start Date for Leave",
    endTime: "End Date for Leave",    
  },
}

function onFormSubmit() {
  var eventObject = getFormResponse();
  var event = createCalendarEvent(eventObject);
}

function getFormResponse() {
  // Get a form object by opening the form using the
  // form id stored in the GLOBAL variable object
  var form = FormApp.openById(GLOBAL.formId),
      //Get all responses from the form. 
      //This method returns an array of form responses
      responses = form.getResponses(),
      //find the length of the responses array
      length = responses.length,
      //find the index of the most recent form response
      //since arrays are zero indexed, the last response 
      //is the total number of responses minus one
      lastResponse = responses[length-1],
      //get an array of responses to every question item 
      //within the form for which the respondent provided an answer
      itemResponses = lastResponse.getItemResponses(),
      //create an empty object to store data from the last 
      //form response
      //that will be used to create a calendar event
      eventObject = {};
  //Loop through each item response in the item response array
  for (var i = 0, x = itemResponses.length; i<x; i++) {
    //Get the title of the form item being iterated on
    var thisItem = itemResponses[i].getItem().getTitle(),
        //get the submitted response to the form item being
        //iterated on
        thisResponse = itemResponses[i].getResponse();
    //based on the form question title, map the response of the 
    //item being iterated on into our eventObject variable
    //use the GLOBAL variable formMap sub object to match 
    //form question titles to property keys in the event object
    switch (thisItem) {
      case GLOBAL.formMap.eventTitle:
        eventObject.title = thisResponse;
        break;
      case GLOBAL.formMap.startTime:
        eventObject.startTime = thisResponse;
        break;
      case GLOBAL.formMap.endTime:
        eventObject.endTime = thisResponse;
        break; 
    } 
  }
   return eventObject;
}

function createCalendarEvent(eventObject) {
  //Get a calendar object by opening the calendar using the
  //calendar id stored in the GLOBAL variable object
  var calendar = CalendarApp.getCalendarById(GLOBAL.calendarId),
      //The title for the event that will be created
      title = eventObject.title,
      //The start time and date of the event that will be created
      startTime = moment(eventObject.startTime).toDate(),
      //The end time and date of the event that will be created
      endTime = moment(eventObject.endTime).toDate();
     
  if (startTime >= endTime){
               
        // Reset the end time to one hour after the start time.
        //end = start + 3600
        endTime = new Date(startTime.getTime()+3600000);
        formatted_end = Utilities.formatDate(new Date(endTime), "GMT", "yyyy-MM-dd' 'HH:mm' UTC'");
  }  
      var event = calendar.createEvent(title, startTime, 
                                       endTime)
     
  return event;   
}