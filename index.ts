import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from "aws-cdk-lib/aws-sns";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import { config } from "dotenv";
import { Construct } from "constructs";
config();

const { AWS_ACCOUNT_ID, AWS_REGION, WEBSITE_URL, SUBSCRIPTION_EMAIL } = process.env;

class WebsiteMonitoringStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const snsTopic = new sns.Topic(this, "website-alerts", {
            displayName: "Website Alerts",
            topicName: "website-alerts"
        });
        const subscription = new sns.Subscription(this, "email-subscription", {
            protocol: sns.SubscriptionProtocol.EMAIL,
            endpoint: SUBSCRIPTION_EMAIL as string,
            topic: snsTopic
        });

        const websiteMonitoring = new lambda.Function(this, "website-monitoring", {
            functionName: "website-monitoring",
            runtime: lambda.Runtime.NODEJS_18_X,
            code: new lambda.AssetCode("src"),
            handler: "lambda.handler",
            timeout: cdk.Duration.seconds(60),
            environment: {
                SNS_TOPIC_ARN: snsTopic.topicArn,
                WEBSITE_URL: WEBSITE_URL as string
            },
            initialPolicy: [
                new iam.PolicyStatement({
                    resources: [ snsTopic.topicArn ],
                    actions: [
                      "sns:Publish",
                    ]
                  })
            ]
        });

        const rule = new events.Rule(this, 'event-rule', {
            schedule: events.Schedule.expression('rate(5 minutes)')
        });
        rule.addTarget(new targets.LambdaFunction(websiteMonitoring));
    }
}

const app = new cdk.App();
new WebsiteMonitoringStack(app, "WebsiteMonitoring", {
    env: {
        account: AWS_ACCOUNT_ID,
        region: AWS_REGION
    }
});