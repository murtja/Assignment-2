import boto3
import json
from datetime import datetime

from flask import Flask, render_template

app = Flask(__name__)
app.debug = True


@app.route('/')
def home():
    return render_template('home.html')


@app.route('/test')
def test():
    aws_region = 'us-west-2'

    # http://russell.ballestrini.net/setting-region-programmatically-in-boto3/
    boto3.setup_default_session(region_name=aws_region)
    cloudwatch = boto3.resource('cloudwatch', region_name=aws_region)
    metric = cloudwatch.Metric('AWS/EC2', 'CPUUtilization')

    stats = metric.get_statistics(
        StartTime=datetime(2017, 2, 28),
        EndTime=datetime(2017, 3, 1),
        Period=600,
        Statistics=['Sum']
    )

    data = stats.data.get('Datapoints')
    result = {}
    result["labels"] = []
    result["datasets"] = []

    dataset = {}
    dataset["label"] = "Utilization Graph"

    points = []
    labels = []
    for data_point in data:
        points.append(int(data_point.get('Sum')))
        labels.append(data_point.get('Timestamp'))

    dataset["data"] = points

    result["datasets"].append(dataset)

    return render_template('test.html', chartData=json.dumps(result))

if __name__ == '__main__':
    app.run()
