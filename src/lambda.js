const axios = require("axios");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const { SNS_TOPIC_ARN, WEBSITE_URL, AWS_REGION } = process.env;

async function handler(event, context, callback) {
    try {
        const startTime = Date.now();
        const response = await axios.get(WEBSITE_URL);
        const operationTime = Date.now() - startTime;
        const logMessage = `Operation time: ${operationTime} ms, Response status: ${response.status}`;
        console.log(logMessage);
        return callback(null, logMessage);
    } catch (err) {
        console.error("Error while fetching the URL:", err);
        await sendSNSNotification(err);
        return callback("Internal error");
    }
}

const sendSNSNotification = async (error) => {
    const sns = new SNSClient({ region: AWS_REGION });
    const message = `Request to ${WEBSITE_URL} failed. Message: ${error}`;
    const command = new PublishCommand({
        Message: message,
        TopicArn: SNS_TOPIC_ARN,
        Subject: `${WEBSITE_URL} Monitoring Alert`
    });
    try {
        const result = await sns.send(command);
        console.log(`SNS Message sent messageId: ${result.MessageId} message: ${message}`);
    } catch (err) {
        console.error("Error while sending SNS notification:", err);
    }
};

module.exports = {
    handler
};
