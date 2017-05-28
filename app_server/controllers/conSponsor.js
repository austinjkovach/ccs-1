var flString = "APP_SERVER/CONTROLLERS/CON_SPONSOR.JS ";
console.log(flString);

var fs = require('fs');
var request = require('request');
var PDFDocument = require('pdfkit');
var pdf = new PDFDocument;
var utilities = require('../../public/js/utilities.js');
var apiOptions = {
    server : "http://localhost:3000"
};

if (process.env.NODE_ENV === 'production') {
    apiOptions.server = "http://ccs.herokuapp.com";
}

var _showError = function(req, res, status) {
    var fString = (flString + "_SHOWeRROR: ");
    var title, content;
    if (status === 404) {
        title = "404, page not found";
        content = "Oops. Can't find this page.";
    } else if (status === 500) {
        title = "500, internal server error";
        content = "Problem with our server.";
    } else {
        title = status + ", something's gone wrong";
        content = "something, somewhere, has gone just a bit wrong";
    }
    console.log(fString + title + " " + content);
    res.status(status);
    res.render('main', {
        title : title,
        content : content
    });
};

// CREATE PDF
var renderPdf = function(req, res, sponsors, page, msg) {
    var pdf = new PDFDocument;
    fString = flString + "RENDER_PDF: ";
    console.log(fString);
    var file = 'texts/' + page + '.pdf';
    var i = 0;
    pdf.pipe(fs.createWriteStream(file));
    pdf.font('Times-Roman');
    pdf.fontSize(20);
    pdf.text(page.toUpperCase());
    pdf.moveDown(1);
    pdf.fontSize(12);
    for(i in sponsors){
        pdf.text(events[i].date + ' ' + events[i].start + '-' + events[i].end);
        pdf.moveUp(1);
        pdf.text(events[i].building,{align:'right'});
        pdf.text(events[i].category);
        pdf.moveUp(1);
        pdf.text(events[i].room,
                 {align: 'right'}
                );
        pdf.text(events[i].title,{
            align: 'center',
            fill: true,
            stroke: true
        });
        if(events[i].presenterFirst){
            pdf.text('Presenter: ',
                     {continued : true});
            pdf.text(
                events[i].presenterFirst +
                    ' ' +
                    events[i].presenterLast +
                    ', ',
                {stroke : true,
                 fill : true,
                 continued : true
                });
            pdf.text(
                events[i].presenterInstitution +
                    ', ' + events[i].presenterCity +
                    ' ' + events[i].presenterState,
                {stroke : false,
                 continued : false}
            );
        }
        if(events[i].hostName){
            pdf.text('Host: ',
                     {
                         continued : true
                     });
            pdf.text(events[i].hostName + ', ',
                     {stroke : true,
                      fill : true,
                      continued : true
                     });
            pdf.text(events[i].hostInstitution + ', ' +
                     events[i].hostCity +
                     ' ' +
                     events[i].hostState,
                     {
                         stroke : false,
                         continued : false
                     }
                    );
        }
        pdf.text(events[i].description,
                 {
                     features: 'ital'
                 });
        pdf.moveDown(1);
    }
    pdf.end();
};

// CREATE TEXT FILES
var renderText = function(req, res, sponsors, page, msg, type) {
    fString = flString + "RENDER_TEXT: ";
    console.log(fString + type);
    var message;
    var delimiter, postfix;
    var file;
    var i = 0;
    var sponsor_string = '';
    switch(type){
    case 'tab':
        delimiter = '\t';
        postfix = '.tab';
        break;
    case 'comma':
        delimiter = ',';
        postfix = '.csv';
        break;
    case 'line':
        delimiter = '\n';
        postfix = '.lb.txt';
        break;
    case 'pdf':
        renderPdf(req, res, events, page, msg);
        break;
    default:
        delimiter = ' ';
        postfix = '.txt';
    }
    file = 'texts/' + page + postfix;
    for(i in sponsors){
        sponsor_string +=
            sponsors[i].sponsor + delimiter +
            sponsors[i].institution +
            '\n';
    }
    fs.writeFile(file, sponsor_string, function(err) {
        if (err){
            return console.error(fString + 'ERR: ' + err);
        } else {
            console.log(fString + "SUCCESS!");
        }
    });
};

var renderSponsorList = function(req, res, sponsors, page, msg, title){
    fString = flString + "RENDER_SPONSOR_LIST: ";
    console.log(fString);
    var message;
    var textArray = ['txt', 'tab', 'comma', 'line'];
        if(!title){
        title = utilities.toTitleCase(page);
    }    
    if(!title){
        title = utilities.toTitleCase(page);
    }
    if(!(sponsors instanceof Array)){
        message = "API lookup error: responseBody must be an array";
        sponsors = [];
    } else if (!sponsors.length) {
        message = "No items found";
    } else {
        if(msg) {
            message = msg;
        }
    }
    console.log(fString + "PAGE: " + page);
    console.log(fString + "SPONSORS[0].SPONSOR: " + sponsors[0].sponsor);
    res.render(page, {
        title: page,
        pageHeader: {
            title: utilities.toTitleCase(title),
            strapline: 'sponsors'
        },
        sponsors : sponsors,
        message : message
    });
    for(var i = 0; i < textArray.length; i++) {
        renderText(req, res, sponsors, page, msg, textArray[i]);
    }
};

module.exports.sponsors = function (req, res) {
    var fString = flString + "SPONSORS: ";
    console.log(fString);
    var requestOptions, path, page, message;
    var sortQuery = 'sponsor';
    var findvalue = "";
    var findkey = "";
    var title = "Sponsors";
    message = "";
    if(!page){
        page = "sponsors";
        path = '/api/sponsors';
    };
    console.log(fString + "REQ.QUERY.SORT: " + req.query.sort);
    if (req.query.sort) {
        sortQuery = req.query.sort;
    }
    if (req.query.findvalue != ""){ 
        findvalue = req.query.findvalue;
        title = findvalue;
    }
    if (req.query.findkey != ""){
        findkey = req.query.findkey;
    }
    requestOptions = {
        url : apiOptions.server + path,
        method : "GET",
        json : {},
        qs : {sort : sortQuery,
              findkey : findkey,
              findvalue : findvalue}
    }
    request(    
        requestOptions,
        function(err, response, body) {
            if (err) {
                console.log(fString + "LIST REQUEST ERROR: " + err);
            } else if (response.statusCode === 200) {
                console.log(fString + "REQUEST SUCCEEDED WITH RESPONSE OF: " + response.statusCode);
                console.log(fString + "REQUEST BODY:" + body[0].sponsor);
                renderSponsorList(req, res, body, page, message, title);
            } else {
                console.log(fString + "LIST REQUEST STATUS: " + response.statusCode);
            }
        }
    );
};

var renderSponsorPage = function (req, res, page, sponsor) {
    var fString = flString + "RENDER_SPONSOR_PAGE: ";
    console.log(fString);
    console.log(fString + "SPONSOR: " + sponsor);
    res.render(page, {
        title: sponsor.sponsor,
        pageHeader: {title : sponsor.sponsor},
        sponsor : sponsor
    });
};


module.exports.sponsorCreate = function(req, res){
    var fString = flString + "SPONSOR_CREATE: ";
    console.log(fString);
    var page = "sponsorNew";
    res.render(page, {
        title: 'CCS - New Sponsor',
        pageHeader : {
            title : 'Create New sponsor',
            strapline : 'note: the sponsor name is required'
        },
    });
};

module.exports.doSponsorCreate = function(req, res){
    var fString = flString + "DO_SPONSOR_CREATE: ";
    console.log(fString);
    var page = "sponsorNew";
    var requestOptions, path, message;
    path = "/api/sponsorsCreate";
    var postData = {
        sponsor : req.body.sponsor,
        institution : req.body.institution,
        creationDate : req.body.creationDate,
        modificationDate : req.body.modificationDate,
        cancelled : req.body.cancelled,
        checked : req.body.checked
    };
    console.log(fString + "POST_DATA.SPONSOR: " + postData.sponsor);
    if(!postData.sponsor){
        console.log("sponsor name is required");
        _showError(req, res, "sponsor name is required");
        return;
    }
    requestOptions = {
        url : apiOptions.server + path,
        method : "POST",
        json : postData
    };
    request(
        requestOptions,
        function(err, response, body){
            console.log(fString + "REQUEST RESPONSE.STATUS_CODE: " + response.statusCode);
            if(response.statusCode === 200) {
                console.log(fString + "SUCCESSFULLY POSTED: " + postData.sponsor + " WITH A STATUS OF 200");
                message = fString + "Successfully posted " + postData.sponsor;
                res.redirect('/sponsors');
            } else if (response.statusCode === 201) {
                console.log(fString + "SUCCESFULLY CREATED NEW sponsor WITH A STATUS OF 201");
                message = "Successfully posted " + postData.sponsor;
                res.redirect('/sponsors');
            }else{
                _showError(req, res, response.statusCode);
            }
        }
    );
};

module.exports.sponsorRead = function(req, res){
    var fString = flString + "SPONSOR_READ: ";
    console.log(fString);
    var requestOptions, path, page;
    page = "sponsor.pug";
    path = "/api/sponsorsRead/" + req.params.sponsorid;;
    console.log(fString + "PATH: " + path);
    console.log(fString + 'SPONSORID: ' + req.params.sponsorid);
    requestOptions = {
        url : apiOptions.server + path,
        method : "GET",
        json : {}
    };
    console.log(fString + "REQUEST_OPTIONS.URL: " + requestOptions.url);
    request (
        requestOptions,
        function(err, response, body) {
            if(err) {
                console.log(fString + "REQUEST ERR: " + err);
            } else if (response.statusCode === 200) {
                console.log(fString + "REQUEST SUCCESSFUL, RESPONSE: " + response.statusCode);
                renderSponsorPage(req, res, page, body);
            } else {
                console.log(fString + "REQUEST STATUS" + response.statusCode);
            }
        }
    );
};

module.exports.sponsorUpdate = function (req, res){
    var fString = flString + "SPONSOR_UPDATE: ";
    console.log(fString);
    var requestOptions, path;
    path = "/api/sponsorsRead/" + req.params.sponsorid;
    var page = 'sponsorUpdate';
    console.log(fString + "PATH: " + path);
    requestOptions = {
        url : apiOptions.server + path,
        method : "GET",
        json : {},
        qs : {}
    };
    console.log(fString + "REQUEST_OPTIONS.URL: " + requestOptions.url);
    request (
        requestOptions,
        function(err, response, body){
            console.log(fString + "REQUEST FUNCTION ERR: " + err);
            renderSponsorPage(req, res, page, body);
        }
    );
};

module.exports.doSponsorUpdate = function(req, res){
    var fString = flString + "DO_SPONSOR_UPDATE: ";
    console.log(fString);
    var sponsorid = req.params.sponsorid;
    var requestOptions, path;
    path = "/api/sponsorUpdate/" + sponsorid;
    var postData = {
        sponsor : req.body.sponsor,
        institution : req.body.institution,
        checked : req.body.checked,
        modified : true,
        modificationDate : Date.now
    };
    requestOptions = {
        url : apiOptions.server + path,
        method : "POST",
        json : postData,
        qs : {}
    };
    request(
        requestOptions,
        function(err, response, body){
            if (response.statusCode === 200){
                res.redirect('/sponsorRead/' + sponsorid);
            } else {
                _showError(req, res, response.statusCode);
            }
        }
    );
};

module.exports.sponsorDelete = function(req, res){
    var requestOptions, path;
    path = "/api/sponsorsDelete/" + req.params.sponsorid;
    requestOptions = {
        url : apiOptions.server + path,
        method : "GET",
        json : {}
    };
    request(
        requestOptions,
        function (err, response, body){
            if (response.statusCode === 204) {
                console.log("SUCCESSFULLY DELETED: " + req.params.sponsorid);
                res.redirect('/sponsors');
            } else {
                _showError(req, res, response.statusCode);
                console.log("DELETE ERROR");
            }
        }
    );
};
