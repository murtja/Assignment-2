var app;
var db;
var bookViewer;
$(document).ready(function () {
    app = firebase.initializeApp(getFireBaseConfig());
    db = app.database();

    $("#dailyServingsForm").submit(function (event) {
        var ageGroup = $('input[name=ageRadio]:checked').val();
        var gender = $('input[name=genderRadio]:checked').val();

        calculateDailyServings(ageGroup, gender);

        // do not submit the form, just show the data in the other div
        event.preventDefault();

        return false;
    });

    getTips();

    google.books.load();
    google.books.setOnLoadCallback(initialize);

});

function initialize() {
    bookViewer = new google.books.DefaultViewer(document.getElementById('viewerCanvas'));
    return bookViewer;
}

function calculateDailyServings(selectedAgeGroup, selectedGender) {
    // Initialize the default app

    db.ref('/servings to per to miy/').once('value').then(function (snapshot) {
        console.log("data retrieve from db");

        var data = snapshot.val();

        var result = {};
        var totalServings = 0;

        var i;
        for (i = 0; i < data.length; i++) {
            var ageGroup = data[i]["ages"];
            var gender = data[i]["gender"];

            if (ageGroup == selectedAgeGroup && gender == selectedGender) {
                result[data[i].fgid] = data[i];

                totalServings += parseInt(data[i].servings);
            }
        }

        $("#calculationOutput").html("Total servings are: " + totalServings);

        initGraph(result);

        var ageSpecificKeywords = '';

        if(selectedAgeGroup == "2 to 3" || selectedAgeGroup == "4 to 8"){
            ageSpecificKeywords = "for kids";
        } else if(selectedAgeGroup == "9 to 13" || selectedAgeGroup == "14 to 18"){
            ageSpecificKeywords = "for teenagers";
        } else if(selectedAgeGroup == "19 to 30" || selectedAgeGroup == "31 to 50"){
            ageSpecificKeywords = "for adults";
        } else {
            ageSpecificKeywords = "for seniors";
        }

        var keywords = "healthy cooking " + ageSpecificKeywords;
        displayBookSuggestions(keywords);

    });
}

function displayBookSuggestions(keywords) {

    var bookOutput = $("#bookOutput");
    var apiKey = "AIzaSyBbmjv7-D8NOxv4KOyMs4lXB7OC7ZtK6SM";
    var endPoint = "https://www.googleapis.com/books/v1/volumes?q=insubject:" + keywords + "&key=" + apiKey;

    $.getJSON(endPoint, function (data) {

        bookOutput.empty();

        var i;
        for (i = 0; i < data.items.length; i++) {
            var book = data.items[i];

            var a = $('<a class="list-group-item" style="cursor: pointer;" id="'+book.id+'">');
            var h4 = $('<h4 class="list-group-item-heading">' + book.volumeInfo.title + '</h4>');

            var description = book.volumeInfo.description || "";

            var maxLength = 200;
            if(description.length > maxLength){
                description = description.substring(0, maxLength) + "...";
            }

            var p = $('<p class="list-group-item-text">' + description + '</p>');

            a.append(h4);
            a.append(p);

            a.click(function(event){
                previewBook($(this).attr('id'));
            });

            bookOutput.append(a);
        }
    });

}

function previewBook(volumeID) {
    bookViewer = initialize();
    bookViewer.load(volumeID);
}

function getTips(){
    db.ref('/directional_statements/').once('value').then(function (snapshot) {
        console.log("tips retrieve from db");

        var data = snapshot.val();

        var randInteger = getRandomIntInclusive(0, data.length);
        var first = data.splice(randInteger, 1);

        randInteger = getRandomIntInclusive(0, data.length);
        var second = data.splice(randInteger, 1);

        randInteger = getRandomIntInclusive(0, data.length);
        var third = data.splice(randInteger, 1);

        var outputDiv = $("#adviceOutput");
        outputDiv.append("<blockquote><p>"+first[0].dir_stmt+"</p></blockquote>");
        outputDiv.append("<blockquote><p>"+second[0].dir_stmt+"</p></blockquote>");
        outputDiv.append("<blockquote><p>"+third[0].dir_stmt+"</p></blockquote>");
    });
}

function initGraph(servingDataObject){

    var labels = [];
    var data = [];

    for(property in servingDataObject){
        if(servingDataObject.hasOwnProperty(property)){
            labels.push(property);
            data.push(servingDataObject[property].servings);
        }
    }

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

    var ctx = document.getElementById("servingsChart");
    var servingsChart = new Chart(ctx, {
        type: 'pie',
        data: dataObject
    });

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