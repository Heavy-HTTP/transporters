const presigner = require('@aws-sdk/s3-request-presigner');
const S3 = require("@aws-sdk/client-s3");

function S3Transporter(bucketName, expirationTime) {

    const client = new S3.S3Client({
        credentials: {
            accessKeyId: '', // Demo purposes only. Please use proper key injection method.
            secretAccessKey: ''  // Demo purposes only. Please use proper key injection method.
        },
        region: "us-east-1",
    });

    const generateUploadURL = async (id) => {
        const pubObjectCommand = new S3.PutObjectCommand({
            Bucket: bucketName,
            Key: id
        });
        const url = await presigner.getSignedUrl(client, pubObjectCommand, { expiresIn: expirationTime });
        return url;
    }
    const terminate = async (id, terminateReason) => {
        const deleteObjectCommand = new S3.DeleteObjectCommand({
            Bucket: bucketName,
            Key: id
        });
        console.log("terminate reason: ", terminateReason)
        await client.send(deleteObjectCommand);
    }

    const injectHeavyRequestBody = async (id) => {
        
        // -- Invoke an async lambda function that process the request body in the S3 bucket
        // await invokeLambda(id);
        // modify the request body as {'isAsync':'true'}
        const bufferedData = Buffer.from(JSON.stringify({'isAsync':'true'}));
        return { content: bufferedData, contentLength: bufferedData.byteLength, contentType: 'application/json' };
    }

    const handleHeavyResponseBody = async (id, content, contentType) => {

        const uploadObjectCommand = new S3.PutObjectCommand({
            Bucket: bucketName,
            Key: id,
            Body: content
        });
        await client.send(uploadObjectCommand);

        const getCommand = new S3.GetObjectCommand({
            Bucket: bucketName,
            Key: id
        });

        const url = presigner.getSignedUrl(client, getCommand, { expiresIn: expirationTime });
        return url;

    }
    return {
        generateUploadURL,
        terminate,
        injectHeavyRequestBody,
        handleHeavyResponseBody
    }
}

module.exports = S3Transporter;