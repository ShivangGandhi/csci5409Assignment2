require("dotenv").config();
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const aws = require('aws-sdk');

aws.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    sessionToken: process.env.SESSION_TOKEN,
    region: process.env.REGION
})

const bucket = process.env.BUCKET

const s3 = new aws.S3();

const uploadFile = async (content) => {
    const params = {
        Bucket: bucket,
        Key: 'test.txt',
        Body: content,
        ACL: 'public-read',
        ContentType: "text/plain"
    }

    const response = await s3.upload(params).promise();

    const fileURL = response.Location

    return fileURL
}

const getFileContent = async () => {

    const params = {
        Bucket: bucket,
        Key: 'test.txt'
    }

    const response = await s3.getObject(params).promise()
    const fileContent = response.Body.toString('utf-8')

    return fileContent

}

const appendFile = async (contentToAdd) => {

    const existingContent = await getFileContent()

    const newContent = existingContent + contentToAdd;

    const urlOfFile = await uploadFile(newContent);
}

app.post("/start", (req, res) => {
    const response = {
        "banner": "<Replace with your Banner ID, e.g. B00123456>",
        "ip": "<Replace with the IPv4 of your EC2 instance, e.g. 74.23.154.12>"
    }
    res.send(response)
})

app.post("/storedata", async (req, res) => {
    const fileData = req.body.data;

    const fileURL = await uploadFile(fileData)

    const response = {
        "s3uri": fileURL
    }
    res.status(200).send(response)
})

app.post("/appenddata", async (req, res) => {

    const fileDataToAppend = req.body.data;

    await appendFile(fileDataToAppend)

    const fileDataUpdated = await getFileContent();

    const response = {
        "s3uri": fileDataUpdated
    }
    res.status(200).send(response)
})

app.delete("/deletefile", async (req, res) => {
    const params = {
        Bucket: bucket,
        Key: 'test.txt'
    }
    await s3.deleteObject(params).promise();

    const fileURL = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`
    const response = {
        "s3uri": fileURL
    }
    res.status(200).send(response)
})

app.listen(3000, () => {
    console.log("Listening at http://localhost:3000");
});