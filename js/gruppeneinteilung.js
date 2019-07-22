var csv_data;
var original_data;
var gruppen_final;
var headers = ['Vorname', 'Nachname', 'Ceviname', 'Geburtstag', 'Ortsgruppe'];

/**
 * https://www.html5rocks.com/de/tutorials/file/dndfiles/
 */
// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
} else {
    alert('In diesem Browser können CSV-Dateien nicht gelesen werden.');
}

$(document).ready(function () {
    // hide pdf preview until data is there
    $("#pdf-preview").hide();

    $('#csv-input').change(function (e) {
        var reader = new FileReader();
        reader.onload = function () {
            // callback after read
            showData(reader.result);
        };
        reader.readAsBinaryString(e.target.files[0]);
    });
    $("#gruppen-anzahl").change(function (e) {
        if (csv_data == undefined) {
            return;
        }
        $("#berechnen").click();
    });

    $("#berechnen").click(function (e) {
        e.preventDefault(); // stop reloading page
        if (csv_data == undefined) {
            return;
        }
        makeGroups();
        var doc = new jsPDF();
        for (var i = 0; i < $("#gruppen-anzahl").val(); i++) {
            var currHeader = [{}, { vorname: 'Vorname', nachname: 'Nachname', ceviname: 'Ceviname', geburtstag: 'Geburtstag', ortsgruppe: 'Ortsgruppe' }];
            currHeader[0]['vorname'] = { content: "Gruppe " + (i + 1), colSpan: 5, styles: { halign: 'center', fillColor: [0, 61, 143], fontSize: 14 } };
            var body = [];
            for (var j = 0; j < gruppen_final[i].length; j++) {
                body.push({
                    vorname: gruppen_final[i][j][0],
                    nachname: gruppen_final[i][j][1],
                    ceviname: gruppen_final[i][j][2],
                    geburtstag: gruppen_final[i][j][3],
                    ortsgruppe: gruppen_final[i][j][4]
                });
            }
            doc.autoTable({
                body: body,
                head: currHeader,
                showHead: 'firstPage',
                pageBreak: 'avoid',
                theme: 'striped',
                didDrawPage: function (data) {
                    // Footer
                    var str = "Seite " + doc.internal.getNumberOfPages()
                    // Total page number plugin only available in jspdf v1.0+
                    if (typeof doc.putTotalPages === 'function') {
                        str = str + " von " + "{total_pages_count_string}";
                    }
                    doc.setFontSize(10);
                    var pageSize = doc.internal.pageSize;
                    var pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                    doc.text(str, data.settings.margin.left, pageHeight - 10);
                    doc.text("KuTo | Gruppeneinteilung", pageSize.width - 54, pageHeight - 10);
                },
            });
        }
        if (typeof doc.putTotalPages === 'function') {
            doc.putTotalPages("{total_pages_count_string}");
        }
        doc.setProperties({title: 'KuTo | Gruppeneinteilung'});
        //doc.save(uuidv4()+'kuto-gruppen.pdf');
        $("#pdf-preview").attr('src', doc.output('datauristring'));
        $("#pdf-preview").show();
        $("#pdf-preview").css("height", "100vh");
    });
});

/**
 * https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array und angepasst
 */
function shuffle(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

var makeGroups = function () {
    var ngroups = $("#gruppen-anzahl").val();
    csv_data = original_data;

    if ($("#tn-mischeln").prop('checked')) {
        csv_data = shuffle(csv_data);
    }

    var tn_per_group = (csv_data.length) / ngroups;
    var tn_per_group_abgerundet = tn_per_group | 0; // convert to int

    if (tn_per_group_abgerundet < 1) {
        alert("Zu viele Gruppen");
        return;
    }

    var gruppen = []

    for (var i = 0; i < ngroups; i++) {
        gruppen[i] = [];
    }

    if ($("#abteilungen-verschieden").prop('checked')) {
        // sort array by Ortsgruppe
        csv_data.sort((a, b) => {
            if (a[4] === b[4]) {
                return 0;
            }
            else {
                return (a[4] < b[4]) ? -1 : 1;
            }
        });
    }

    for (var i = 0; i < csv_data.length; i++) {
        gruppen[i % ngroups].push(csv_data[i]);
    }

    gruppen_final = gruppen;

    generateHtmlTable(gruppen);
};

var trimData = function (csv) {
    var idxToKeep = [];
    // create index array with idx to keep
    for (var i = 0; i < headers.length; i++) {
        idxToKeep.push(csv[0].indexOf(headers[i]));
    }
    for (var i = 0; i < csv.length; i++) {
        var temp = csv[i];
        csv[i] = [];
        if (temp.indexOf('Teilnehmer/-in') == -1) {
            // kein TN, darum überspringen
            continue;
        }
        for (var j = 0; j < temp.length; j++) {
            if (idxToKeep.indexOf(j) != -1) // keep
            {
                csv[i].push(temp[j]);
            }
        }
    }
    // remove empty sub-arrays
    var csv = csv.filter(function (arr) {
        return arr.length;
    });

    return csv;
}

var showData = function (raw_csv) {
    var csv = trimData($.csv.toArrays(raw_csv, { separator: ';' }));
    csv_data = csv;
    original_data = csv;
}

function generateHtmlTable(data) {
    // clear tables
    $("#gruppen-display").html("");
    for (var gruppe = 0; gruppe < data.length; gruppe++) {
        var html = '<h2>Gruppe ' + (gruppe + 1) + ' (' + (data[gruppe].length) + ' TN)</h2><table class="table table-condensed table-hover table-striped" id="gruppe-' + (gruppe + 1) + '">';
        if (typeof (data[0]) === 'undefined') {
            return null;
        } else {
            html += '<thead>';
            html += '<tr>';
            $.each(headers, function (index, colData) {
                html += '<th>';
                html += colData;
                html += '</th>';
            });
            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';
            $.each(data[gruppe], function (index, row) {
                html += '<tr>';
                $.each(row, function (index, colData) {
                    html += '<td>';
                    html += colData;
                    html += '</td>';
                });
                html += '</tr>';
            });
            html += '</tbody>';
            html += '</table>';

            $('#gruppen-display').append(html);
        }
    }
}	