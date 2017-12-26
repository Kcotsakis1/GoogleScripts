//Written By Kate Cotsakis WFO CYS

////////////////////////////////////////////////////////////
//  Script that takes the input from the google form and puts it on the office calendar.
//
////////////////////////////////////////////////////////////

//Load the Moment.js library, used in the creation of time stamps. 
var moment = Moment.load();

var GLOBAL = {
    //the id of the form we will use to create calendar events 
    formId: "",

    //the id of the calendar we will create events on
    calendarId: "",

    //a mapping of form item titles to sections of the calendar event
    formMap: {
        eventTitle: "Event Title",
        startTime: "Event Date and Start Time",
        endTime: "Event Date and End Time",
        description: "Event Description",
        location: "Event Location",
        email: "Who's Involved",
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
        lastResponse = responses[length - 1],
        //get an array of responses to every question item 
        //within the form for which the respondent provided an answer
        itemResponses = lastResponse.getItemResponses(),
        //create an empty object to store data from the last 
        //form response
        //that will be used to create a calendar event
        eventObject = {};
    //Loop through each item response in the item response array
    for (var i = 0, x = itemResponses.length; i < x; i++) {
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
            case GLOBAL.formMap.description:
                eventObject.description = thisResponse;
                break;
            case GLOBAL.formMap.location:
                eventObject.location = thisResponse;
                break;
            case GLOBAL.formMap.email:
                eventObject.email = thisResponse;
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
    //an options object containing the description and guest list
    //for the event that will be created
    var options = {
        description: eventObject.description,
        guests: eventObject.email,
        location: eventObject.location,
    };
    try {
        //create a calendar event with given title, start time,
        //end time, and description and people involved stored in an 
        //options argument
        var event = calendar.createEvent(title, startTime,
            endTime, options)
    } catch (e) {
        //delete the guest property from the options variable, 
        //as an invalid email address with cause this method to 
        //throw an error.
        delete options.guests
        //create the event without including the people involved
        if (startTime >= endTime) {
            // Reset the end time to one hour after the start time.
            //end = start + 3600
            endTime = new Date(startTime.getTime() + 3600000);
            formatted_end = Utilities.formatDate(new Date(endTime), "GMT", "yyyy-MM-dd' 'HH:mm' UTC'");
        }
        var event = calendar.createEvent(title, startTime,
            endTime, options)
    }
    return event;
}