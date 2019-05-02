# dynatrace-service-throughput-check
Node.js function to check throughput of service and create problem event based on threshold.  Written for AWS Lambda implementation.
The proper/preferred method for testing whether or not a service is available is to use a synthetic monitor.  However, sometimes that is not possible/feasible.  When a service becomes unavailable, the throughput will drop to zero.  Note that this is different than a service failing - such as returning an HTTP 500 response code.  This Node.js function will check if the throughput has dropped below a threshold in a specified timeframe.  If it has, it will then create a new problem event in the Dynatrace environment.

### Limitations (Dynatrace SaaS & Managed)
This function will be executed in AWS and will need to reach the Dynatrace API URL.  This will be OK for Dynatrace SaaS environments, but will probably not work for Dynatrace Managed environments.  For Dynatrace Managed environments, use proxy servers and/or firewall changes to expose the Dynatrace API URL to AWS.

### Prerequisites
1) Dynatrace environment API URL, such as 'https://abc123.live.dynatrace/api/v1/' (trailing slash included)
2) Dynatrace environment API Token, refer to: https://www.dynatrace.com/support/help/shortlink/api-authentication
3) Dynatrace environment Service-ID value, such as 'SERVICE-88BB3B253335AF2C'

You can obtain the Service-ID value from the URL address bar while viewing the Service overview page:
```
https://<tenant-id>.live.dynatrace.com/#serviceOverview;id=SERVICE-88BB3B253335AF2C;gf=all
```

### Create the AWS Lambda function

Create a Node.js Lambda function from scratch.

Copy the source code (or upload the file) from index.js.

### Environment Variables

The Node.js function makes use of environment variables for configuration.  All environment variables here are required.

``apitoken`` = ``<Dynatrace Environment API Token Value>``\
``endpoint`` = ``<Dynatrace Environment API Endpoint Value>``\
``relativetime`` = ``x mins`` refer to: https://www.dynatrace.com/support/help/shortlink/api-metrics-data-points#possible-values \
``serviceid`` = ``<Dynatrace Environment Service-ID Value>``\
``threshold`` = ``<non-inclusive threshold value>`` A value of 1 would generate a problem if result is less than 1.\
``eventtimeout`` = ``number of minutes between checks + 1`` If checking every 5 minutes, set value to 6.\
``eventsource`` = ``source of problem event text`` Recommend using something similar to 'AWS Lambda Throughput Check'.\
``eventtitle`` = ``title of problem event text`` Recommend using something similar to 'Unexpected Low Throughput'.


### Testing the function
When testing the function, the Testing Event content does not matter.  Using a default template is fine.\
A successful test should return ``Throughput OK`` or ``Throughput LOW``.\ 
Example log output of a request where the value of count is greater than or equal to the threshold.\
```
START RequestId: 83463589-72f2-4ced-8a7b-bf6e31565c57 Version: $LATEST
2019-05-02T21:44:58.497Z	83463589-72f2-4ced-8a7b-bf6e31565c57	Status: 200
2019-05-02T21:44:58.497Z	83463589-72f2-4ced-8a7b-bf6e31565c57	JSON dataPoints: { 'SERVICE-88BB3B253335AF2C': [ [ 1556833140000, 2 ] ] }
2019-05-02T21:44:58.497Z	83463589-72f2-4ced-8a7b-bf6e31565c57	Count: 2
END RequestId: 83463589-72f2-4ced-8a7b-bf6e31565c57
REPORT RequestId: 83463589-72f2-4ced-8a7b-bf6e31565c57	Duration: 104.71 ms	Billed Duration: 200 ms 	Memory Size: 128 MB	Max Memory Used: 58 MB	
```

### Scheduling the function

This function should be scheduled to run on an interval.  It should not be called manually, systematically, or through the API Gateway.
1) Add 'CloudWatch Events` to the list of triggers from the list on the left.
2) Create a rule and select 'Schedule' with a fixed rate of ``X`` minutes.
3) Set the target to 'Lambda Function' and select the Lambda function name.
4) Enable the rule.
