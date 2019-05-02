exports.handler = (event, context, callback) => {
    
    const https = require('https');
    const URL = require('url').URL;
	
	// Declare Dynatrace API timeseries endpoint
    var timeseriesquery = "?timeseriesId=com.dynatrace.builtin:service.requests&relativeTime=" + process.env.relativetime + "&aggregationType=COUNT&queryMode=total&entity=" + process.env.serviceid + "&api-token=" + process.env.apitoken;
    var timeseriesurl = process.env.endpoint + 'timeseries' + timeseriesquery;
    var endpoint = new URL(timeseriesurl);
    
    //console.log('URL for timeseries call:',endpoint.href);
	
	// Call Dynatrace API timeseries endpoint
    const req = https.request(endpoint, (res) => {
        let body = '';
        var jsonbody;
        console.log('Status:', res.statusCode);
        //console.log('Headers:', JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            //console.log('Successfully processed HTTPS response');
            //console.log('Content Type:',res.headers['content-type']);
            // If we know it's JSON, parse it
            if (res.headers['content-type'] === 'application/json;charset=utf-8') {
                //console.log('Parsing JSON');
                jsonbody = JSON.parse(body);
            }
            
            // Log the JSON dataPoints
            console.log('JSON dataPoints:',jsonbody.result.dataPoints);
            
            var datapoints = JSON.stringify(jsonbody.result.dataPoints);
          
            var count;
            // Check if any datapoints were returned (if not, then throughput is 0)
            if (datapoints === '{}') {
                count = 0;
            } else {
                // Set the value of count from the returned datapoints
				count = jsonbody.result.dataPoints[process.env.serviceid][0][1];
            }
            
			// Log the value of count.
			console.log('Count:',count);
            
            // Evaluate the throughput of the service
            var throughputresponse = 'Throughput OK'; // Return response of 'Throughput OK' if throughput is fine
            if (count < process.env.threshold) { // If throughput is less than configured threshold
                throughputresponse = 'Throughput LOW';
                
				// Throughput is lower than threshold, create a problem event
                console.log('Throughput LOW.  Pushing Problem Event.');
                
                // Set Event API JSON Payload and log it
                var eventspayload = '{"eventType": "AVAILABILITY_EVENT","timeoutMinutes": ' + process.env.eventtimeout + ',"attachRules":{"entityIds": [ "' + process.env.serviceid + '" ] },"source" : "' + process.env.eventsource + '","description" : "The observed service throughput (' + count + ' requests) in the last ' + process.env.relativetime + ' was lower than the threshold of ' + process.env.threshold + '","title" : "' + process.env.eventtitle + '"}';
                console.log('Event JSON Body:',eventspayload);
                
                // Set Event API Options
                var eventsoptions = {
                host: endpoint.host,
                port: 443,
                path: process.env.endpoint + 'events',
                method: 'POST',
                headers: {
                      "Authorization": "Api-Token " + process.env.apitoken,
                      "Content-Type": "application/json"
                  }
                };
                
                //console.log(eventsoptions);
                
                // Make Event API Call
                const eventreq = https.request(eventsoptions, (eventres) => {
                    let eventbody = '';
                    console.log('Status:', eventres.statusCode);
                    eventres.setEncoding('utf8');
                    eventres.on('data', (chunk) => eventbody += chunk);
                    eventres.on('end', () => {
                        //console.log('Successfully processed HTTPS response');
                        console.log(eventbody);
                        //console.log(eventres.headers['content-type']);
                        // If we know it's JSON, parse it
                        if (eventres.headers['content-type'] === 'application/json') {
                            eventbody = JSON.parse(eventbody);
                        }
                        callback(null, eventbody);
                    });
                });
                eventreq.on('error', callback);
				// Send the eventspayload JSON in the body
                eventreq.write(eventspayload);
                eventreq.end();
                
            }
            
            callback(null, throughputresponse);
        });
      });
      req.on('error', callback);
      req.write(JSON.stringify(null));
      req.end();
      
};
