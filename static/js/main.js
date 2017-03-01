var app;
var db;
var servingsChart;

// ready function that loads when the website finishes loading
$(document).ready(function () {

    // init firebase
    app = firebase.initializeApp(getFireBaseConfig());
    db = app.database();

    // setup button handler for when they submit age and gender
    $("#dailyServingsForm").submit(function (event) {
        // show the loading modal
        $('#myModal').modal('toggle');

        // get info from the inputs
        var ageGroup = $('input[name=ageRadio]:checked').val();
        var gender = $('input[name=genderRadio]:checked').val();

        // display relevant data
        calculateDailyServings(ageGroup, gender);

        // do not submit the form, just show the data in the other div
        event.preventDefault();

        return false;
    });

    // Get the tips from the database
    getTips();

    // Load the book viewer library
    google.books.load();

});

function calculateDailyServings(selectedAgeGroup, selectedGender) {

    // get the serving data from the database
    db.ref('/servings to per to miy/').once('value').then(function (snapshot) {
        var data = snapshot.val();

        var result = {};
        var totalServings = 0;

        // collect the serving data for the specified age and gender
        var i;
        for (i = 0; i < data.length; i++) {
            var ageGroup = data[i]["ages"];
            var gender = data[i]["gender"];

            // if matches put it in the result
            if (ageGroup == selectedAgeGroup && gender == selectedGender) {
                result[data[i].fgid] = data[i];

                // accumulate the total as well
                totalServings += parseInt(data[i].servings);
            }
        }

        // update the div to show the total servings
        $("#calculationOutput").html("<h3>Total servings are: " + totalServings + "</h3>");

        // initialize the graph to display pie chart of the servings
        initGraph(result);

        // determine age group keywords
        var ageSpecificKeywords = '';

        if (selectedAgeGroup == "2 to 3" || selectedAgeGroup == "4 to 8") {
            ageSpecificKeywords = "for kids";
        } else if (selectedAgeGroup == "9 to 13" || selectedAgeGroup == "14 to 18") {
            ageSpecificKeywords = "for teenagers";
        } else if (selectedAgeGroup == "19 to 30" || selectedAgeGroup == "31 to 50") {
            ageSpecificKeywords = "for adults";
        } else {
            ageSpecificKeywords = "for seniors";
        }

        var keywords = "healthy cooking " + ageSpecificKeywords;

        // get relevant books for the keywords
        displayBookSuggestions(keywords);

    });
}

function displayBookSuggestions(keywords) {

    var bookOutput = $("#bookOutput");
    var apiKey = "AIzaSyBbmjv7-D8NOxv4KOyMs4lXB7OC7ZtK6SM";
    var endPoint = "https://www.googleapis.com/books/v1/volumes?q=insubject:" + keywords + "&key=" + apiKey;

    // make API call to google books to get the relevant books
    $.getJSON(endPoint, function (data) {

        // get rid of existing results
        bookOutput.empty();

        // for each result add a link to the output div
        var i;
        for (i = 0; i < data.items.length; i++) {
            var book = data.items[i];

            // create the list item for the book
            var a = $('<a class="list-group-item" style="cursor: pointer;" id="' + book.id + '">');
            var h4 = $('<h4 class="list-group-item-heading">' + book.volumeInfo.title + '</h4>');

            var description = book.volumeInfo.description || "";

            var maxLength = 200;
            if (description.length > maxLength) {
                description = description.substring(0, maxLength) + "...";
            }

            // create the description that goes with the list item
            var p = $('<p class="list-group-item-text">' + description + '</p>');

            // insert them into the DOM
            a.append(h4);
            a.append(p);

            // add click handler so that it loads the book preview when clicked
            a.click(function (event) {
                // show the modal
                $('#myModal').modal('toggle');

                // remove the active class from the currently clicked one
                $("#bookOutput a.active").removeClass("active");

                // add active class to this one that was just clicked
                $(this).addClass("active");

                // preview the book with the id of this one that was clicked
                previewBook($(this).attr('id'));

            });

            bookOutput.append(a);
        }

        // hide the modal since all the work is done
        $('#myModal').modal('toggle');
    });

}

function previewBook(volumeID) {

    // create a new viewer
    var bookViewer = new google.books.DefaultViewer(document.getElementById('viewerCanvas'));

    // load the book with the specified volumeID and handlers
    // https://developers.google.com/books/docs/viewer/developers_guide#handling-failed-initializations
    bookViewer.load(volumeID, previewFail, previewSuccess);
}

function previewFail(){
    // show alert
    $("#viewerCanvas").html('<div class="alert alert-danger alert-dismissible fade in" role="alert"> <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button> <h4>Oops!</h4> <p>Book Preview was not Available for this book.</p> </div>');

    // hide modal
    $('#myModal').modal('toggle');
}

function previewSuccess(){
    // hide modal
    $('#myModal').modal('toggle');
}

function getTips() {

    // get tips from the database
    db.ref('/directional_statements/').once('value').then(function (snapshot) {

        var data = snapshot.val();

        // generate random integer to select random tip and repeat 3 times
        // note that each selected item is removed from data list so that it can't be selected again
        // to ensure that we get 3 different tips
        var randInteger = getRandomIntInclusive(0, data.length-1);
        var first = data.splice(randInteger, 1);

        randInteger = getRandomIntInclusive(0, data.length-1);
        var second = data.splice(randInteger, 1);

        randInteger = getRandomIntInclusive(0, data.length-1);
        var third = data.splice(randInteger, 1);

        // display the tips in the output div
        var outputDiv = $("#adviceOutput");
        outputDiv.empty();
        outputDiv.append("<blockquote><p>" + first[0].dir_stmt + "</p></blockquote>");
        outputDiv.append("<blockquote><p>" + second[0].dir_stmt + "</p></blockquote>");
        outputDiv.append("<blockquote><p>" + third[0].dir_stmt + "</p></blockquote>");
    });
}

function initGraph(servingDataObject) {

    var labels = [];
    var data = [];

    // get the data and labels for the 4 food groups
    for (var property in servingDataObject) {
        if (servingDataObject.hasOwnProperty(property)) {

            // get the data for this food group
            data.push(parseInt(servingDataObject[property].servings));

            // get the label for this food group
            if(property == "vf"){
                labels.push("Vegetables & Fruits");
            } else if(property == "gr"){
                labels.push("Grains");
            } else if(property == "mi"){
                labels.push("Milk & Dairy");
            } else if(property == "me"){
                labels.push("Meat & Alternatives");
            } else {
                labels.push("Other");
            }

        }
    }

    // create the chartjs datastructure for a pie chart with some background colors
    // http://www.chartjs.org/docs/#doughnut-pie-chart-example-usage
    var dataObject = {};
    dataObject.labels = labels;
    dataObject.datasets = [
        {
            "label": "Servings Per Day",
            "data": data,
            "backgroundColor": [
                "#42973e",
                "#eb9b59",
                "#fdf4ff",
                "#ff4843"
            ]
        }
    ];

    // Destroy old chart if it exists
    if(servingsChart){
        servingsChart.clear();
        servingsChart.destroy();
    }

    // draw the chart
    var ctx = document.getElementById("servingsChart");
    servingsChart = new Chart(ctx, {
        type: 'pie',
        data: dataObject
    });

    // remove the div that shows when there is no chart loaded
    $("#chartNotReadyDiv").empty();

}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function getFireBaseConfig() {

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyCp5e3EdLgjBURRoPb5Mi1LUh3iivrmM9k",
        authDomain: "assignment-2-2d266.firebaseapp.com",
        databaseURL: "https://assignment-2-2d266.firebaseio.com",
        storageBucket: "assignment-2-2d266.appspot.com",
        messagingSenderId: "882521925390"
    };

    return config;

}