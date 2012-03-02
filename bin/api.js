// EMC Confidential Information, protected under EMC Bilateral Non-Disclosure Agreement.
// Copyright © 2012 EMC Corporation, All Rights Reserved
//
// Node.js endpoint for ProjectRazor API

var razor_bin = __dirname+ "/razor -w"; // Set project_razor.rb path
console.log(razor_bin);
var exec = require("child_process").exec; // create our exec object
var express = require('express'); // include our express libs

app = express.createServer(); // our express server
app.use(express.bodyParser()); // Enable body parsing for POST
// app.use(express.profiler()); // Uncomment for profiling to console
// app.use(express.logger()); // Uncomment for logging to console

// Exception for boot API request
app.get('/razor/api/boot*',
    function(req, res) {
        args = req.path.split("/");
        args.splice(0,3);
        var args_string = getArguments(args);
        if (args.length < 2) {
            args_string = args_string + "default "
        }
        query_param = "'" + JSON.stringify(req.query) + "'";
        console.log(razor_bin + args_string + query_param);
        //process.stdout.write('\033[2J\033[0;0H'); - screen clearing trick
        exec(razor_bin + args_string + query_param, function (err, stdout, stderr) {
            res.send(stdout, 200, {"Content-Type": "text/plain"});
        });
    });

app.get('/razor/api/*',
    // TODO - need to decode vars

    function(req, res) {
        args = req.path.split("/");
        args.splice(0,3);
        var args_string = getArguments(args);
        if (args.length < 2) {
            args_string = args_string + "default "
        }
        query_param = "'" + JSON.stringify(req.query) + "'";
        console.log(razor_bin + args_string + query_param);
        //process.stdout.write('\033[2J\033[0;0H'); - screen clearing trick
        exec(razor_bin + args_string + query_param, function (err, stdout, stderr) {
            returnResult(res, stdout);
        });
    });



app.post('/razor/api/*',
    function(req, res) {
        args = req.path.split("/");
        args.splice(0,3);
        var json_data = "'" + req.param('json_hash', null) + "'";

        var args_string = getArguments(args);
        //process.stdout.write('\033[2J\033[0;0H');
        console.log(args_string);
        console.log(razor_bin + args_string + json_data);
        exec(razor_bin + args_string + json_data, function (err, stdout, stderr) {
            returnResult(res, stdout);
        });
    });


app.get('/*',
    function(req, res) {
        switch(req.path)
        {
            case "/":
                res.send('404 Error: Bad Request', 404);
                break;
            case "/razor":
                res.send('404 Error: Bad Request(No module selected)', 404);
                break;
            case "/razor/api":
                res.send('404 Error: Bad Request(No slice selected)', 404);
                break;
            default:
                res.send('404 Error: Bad Request', 404);
        }
    });

function returnResult(res, json_string) {
    return_obj = JSON.parse(json_string);

    if (return_obj['errcode'] == 0) {
        res.send(json_string, 200, {"Content-Type": "json/application"});
    } else {
        res.send(json_string, 400, {"Content-Type": "json/application"});
    }
}

function getArguments(args_array) {
    var arg_string = " ";
    for (x = 0; x < args.length; x++) {
        arg_string = arg_string + args[x] + " "
    }
    return arg_string;
}

function getConfig() {
    exec(razor_bin + " config read", function (err, stdout, stderr) {
        console.log(stdout);
        startServer(stdout);
    });
}

// TODO Add catch for if project_razor.js is already running on port
// Start our server if we can get a valid config
function startServer(json_config) {
    config = JSON.parse(json_config);
    if (config['@api_port'] != null) {
        app.listen(config['@api_port']);
        console.log('ProjectRazor API Web Server started and listening on:%s', app.address().port);
    } else {
        console.log("There is a problem with your ProjectRazor configuration. Cannot load config.")
    }
}


getConfig();
