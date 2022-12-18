const presigner = require('@aws-sdk/s3-request-presigner');
const S3 = require("@aws-sdk/client-s3");

function stream2buffer(stream) {

    return new Promise((resolve, reject) => {
        const _buf = [];
        stream.on("data", (chunk) => { _buf.push(chunk); _buf.push() });
        stream.on("end", () => resolve(Buffer.concat(_buf)));
        stream.on("error", (err) => reject(err));
    });
}

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
        const downloadObjectCommand = new S3.GetObjectCommand({
            Bucket: bucketName,
            Key: id
        });

        const item = await client.send(downloadObjectCommand);
        const bufferedData = await stream2buffer(item.Body);
        await terminate(id, 'request-completed')
        return { content: bufferedData, contentLength: item.Body.headers['content-length'], contentType: item.Body.headers['content-type'] };
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