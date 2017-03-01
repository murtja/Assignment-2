import boto3
from datetime import datetime

from flask import Flask, render_template

app = Flask(__name__)
app.debug = True


@app.route('/')
def home():
    return render_template('home.html')


@app.route('/test')
def test():
    boto3.setup_default_session(region_name='us-east-1')
    cloudwatch = boto3.resource('cloudwatch', region_name='us-east-1')
    metric = cloudwatch.Metric('AWS/EC2', 'CPUUtilization')

    stats = metric.get_statistics(
        StartTime=datetime(2017, 2, 28),
        EndTime=datetime(2017, 3, 1),
        Period=60,
        Statistics=['Sum']
    )

    return render_template('test.html', utilitzation=str(stats))

if __name__ == '__main__':
    app.run()
