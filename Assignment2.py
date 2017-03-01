import boto3
import json
import time
from datetime import datetime

from flask import Flask, render_template

app = Flask(__name__)
app.debug = True


@app.route('/')
def home():
    return render_template('home.html')


@app.route('/test')
def test():
    # my instance is on this region
    aws_region = 'us-west-2'

    # create resource client to amazon cloudwatch
    # http://russell.ballestrini.net/setting-region-programmatically-in-boto3/
    boto3.setup_default_session(region_name=aws_region)
    cloudwatch = boto3.resource('cloudwatch', region_name=aws_region)

    # get the metric i need for workload
    metric = cloudwatch.Metric('AWS/EC2', 'CPUUtilization')

    # get the metrics for the specified date range
    stats = metric.get_statistics(
        StartTime=datetime(2017, 2, 28),
        EndTime=datetime(2017, 3, 2),
        Period=600,
        Statistics=['Sum']
    )

    # get the datapoints from the API call
    data = stats.get('Datapoints')

    # create chartjs datastructure
    # http://www.chartjs.org/docs/#line-chart-example-usage
    result = {}
    result["datasets"] = []

    dataset = {}
    dataset["label"] = "Utilization Graph"

    points = []
    labels = []

    # add each datapoint to the data array and get label into label array
    for data_point in data:
        points.append(int(data_point.get('Sum')))

        # turn timestamp into a unix timestamp number
        dtime = data_point.get('Timestamp')
        labels.append(str(time.mktime(dtime.timetuple())))

    dataset["data"] = points

    result["labels"] = labels
    result["datasets"].append(dataset)

    # convert result into json string and send with template
    return render_template('test.html', chartData=json.dumps(result))

if __name__ == '__main__':
    app.run()
