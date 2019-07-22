/**
 * https://www.html5rocks.com/de/tutorials/file/dndfiles/
 */

var csv_data;

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
} else {
    alert('In diesem Browser können CSV-Dateien nicht gelesen werden.');
}

$(document).ready(function () {
    $('#csv-input').change(function (e) {
        var reader = new FileReader();
        reader.onload = function () {
            // callback after read
            showData(reader.result);
        };
        reader.readAsBinaryString(e.target.files[0]);
    });
    $("#gruppen-anzahl").change(function(e){
        if(csv_data == undefined) {
            return;
        }
        makeGroups();
    });
    $("#berechnen").click(function (e) {
        e.preventDefault(); // stop reloading page
        if (csv_data == undefined) {
            return;
        }
        makeGroups();
    });
});

/**
 * https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array und angepasst
 */
function shuffle(array) {
    let counter = array.length - 1;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = 1 + Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter + 1];
        array[counter + 1] = array[index];
        array[index] = temp;
    }

    return array;
}

var makeGroups = function () {
    var abteilung_verschieden = false;
    var ngroups = $("#gruppen-anzahl").val();
    if ($("#abteilungen-verschieden").prop('checked')) {
        abteilung_verschieden = true;
    }

    if ($("#tn-mischeln").prop('checked')) {
        csv_data = shuffle(csv_data);
        console.log(csv_data);
    }

    var tn_per_group = (csv_data.length - 1) / ngroups; // header is first row
    var tn_per_group_abgerundet = tn_per_group | 0; // convert to int

    if (tn_per_group_abgerundet < 1) {
        alert("Zu viele Gruppen");
        return;
    }

    var addedTN = [];
    var gruppen = []

    if (!abteilung_verschieden) {
        for (var i = 0; i < ngroups; i++) {
            gruppen[i] = [];
            gruppen[i].push(csv_data[0]); // header
        }

        for (var i = 0; i < csv_data.length - 1; i++) {
            gruppen[i % ngroups].push(csv_data[i + 1]); // skip header
        }

        generateHtmlTable(gruppen);
    }
};


var trimData = function (csv) {
    var headersToKeep = ['Vorname', 'Nachname', 'Ceviname', 'Geburtstag', 'Ortsgruppe'];
    var idxToKeep = [];
    // create index array with idx to keep
    for (var i = 0; i < headersToKeep.length; i++) {
        idxToKeep.push(csv[0].indexOf(headersToKeep[i]));
    }
    for (var i = 0; i < csv.length; i++) {
        var temp = csv[i];
        csv[i] = [];
        if (temp.indexOf('Teilnehmer/-in') == -1 && i != 0) {
            // kein TN, darum überspringen
            continue;
        }
        csv[i] = [];
        for (var j = 0; j < temp.length; j++) {
            if (idxToKeep.indexOf(j) != -1) // keep
            {
                csv[i].push(temp[j]);
            }
        }
    }
    // remove empty sub-arrays
    return csv.filter(function (arr) {
        return arr.length;
    });
}


var showData = function (raw_csv) {
    var csv = trimData($.csv.toArrays(raw_csv, { separator: ';' }));
    csv_data = csv;
}


function generateHtmlTable(data) {
    // clear tables
    $("#gruppen-display").html("");
    for (var gruppe = 0; gruppe < data.length; gruppe++) {
        var html = '<h2>Gruppe ' + (gruppe + 1) + ' (' + (data[gruppe].length - 1) + ' TN)</h2><table  class="table table-condensed table-hover table-striped">';
        if (typeof (data[0]) === 'undefined') {
            return null;
        } else {
            $.each(data[gruppe], function (index, row) {
                //bind header
                if (index == 0) {
                    html += '<thead>';
                    html += '<tr>';
                    $.each(row, function (index, colData) {
                        html += '<th>';
                        html += colData;
                        html += '</th>';
                    });
                    html += '</tr>';
                    html += '</thead>';
                    html += '<tbody>';
                } else {
                    html += '<tr>';
                    $.each(row, function (index, colData) {
                        html += '<td>';
                        html += colData;
                        html += '</td>';
                    });
                    html += '</tr>';
                }
            });
            html += '</tbody>';
            html += '</table>';

            $('#gruppen-display').append(html);
        }
    }
}	