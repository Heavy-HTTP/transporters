# Transporter

Heavy HTTP is designed to overcome the payload limitations in Rest HTTP communication. In simple terms Heavy HTTP allows clients and Servers to share an unlimited amount of data within a single request-response flow. For that Heavy HTTP relies on an alternative communication protocol backed by temporary or permanent storage. Interestingly Heavy HTTP can rely on any storage mechanism as far as the storage mechanism agrees with the communication protocol. 

In order to agree with the communication protocol the storage mechanism must have the following capabilities. 

1. Upload content via Signed URLs (PUT method)
2. Download content via Signed URLs (GET method)

Transporter is the interface that hooks the storage mechanism with the Heavy HTTP Server connector so that Heavy HTTP can perform its magic. In addition to that, the Transporter provides the opportunity for developers to control the behavior of heavy request and responses. 


## Transporter Interface 

 The generic transporter interface is always common across all the languages/run-times. Based on the language the syntax is varied. Please refer to the related run-time/language Heavy HTTP Server connectors to learn the exact method signatures of the interface. 

	
    interface PayloadResponse {
        contentLength: string,
        contentType: string,
        content: Buffer
    }


    interface Transporter {
        generateUploadURL: (id: string) => String,
        terminate: (id: string, terminationCode:string) => void,
        injectHeavyRequestBody: (id: string) => PayloadResponse,
        handleHeavyResponseBody: (id: string, content: Buffer, contentType: string | null) => String,
    }

	

## Default Implementation of Transporter Interface 

As it is mentioned in the beginning, the primary goal of the transporter interface is to hook the storage layer with the Heavy HTTP Server connector. Hence a default implementation of Transporter interface must fulfill that requirement. Please refer to [S3-Node-default-transporter](https://github.com/Heavy-HTTP/transporters/blob/main/S3/S3-Node-default-transporter.js) for an example implementation.


1. **`generateUploadURL: (id: string) => String`**\
    This method is invoked at the beginning of a Heavy HTTP request. When the Heavy HTTP Client requests a signed URL from the Heavy HTTP Server connector, the server connector invokes this method by providing a unique id. And this method should return a signed URL that can be utilized to upload the request body. The uploaded content must be uniquely identifiable by the unique id shared with this method. 

2. **`injectHeavyRequestBody: (id: string) => PayloadResponse`**\
    Once the request is uploaded to the storage layer, this method is invoked by the server. The expectation of the method is to fetch the request body from the storage mechanism and return it to the Heavy HTTP Server connector so that connector can append that to the ongoing request body. Once the request body is fetched from the storage layer it can be deleted from the layer as well.

3. **`handleHeavyResponseBody: (id: string, content: Buffer, contentType: string | null) => String`**\
    If the response body is larger than the configured response threshold this method is executed. Heavy HTTP Server connector invokes the method with the response body, content type and a unique id with the expectation of a signed URL to download the content. So the implementation must support that behaviour.

4. **`terminate: (id: string, terminationCode:string) => void`**\
    At the end of every Heavy HTTP communication flow, this method is triggered. The termination code is can be utilized to identify the exact flow. 
    
    **Termination Codes**\
    a. download-end: Heavy HTTP client has received the response data.\
    b. send-abort: Heavy HTTP client has aborted the request uploading process.\
    c. download-abort: Heavy HTTP client has aborted the response downloading process.\
    d. send-error: Heavy HTTP client has failed to upload the requested data.

    The default expectation of the method is to delete the content from the storage layer (if exists) when this method is invoked.


## Advance Implementation of Transporter Interface 

In addition to the primary objective, the Transporter interface can be utilized to control the heavy requests and responses as well. This is just a guideline for an advanced implementation of the Transporter interface. Please refer to [S3-Node-advance-transporter](https://github.com/Heavy-HTTP/transporters/blob/main/S3/S3-Node-advance-transporter.js) for an example implementation.

1. **`generateUploadURL: (id: string) => String`**\
    Similar to the default implementation.

2. **`injectHeavyRequestBody: (id: string) => PayloadResponse`**\
    Rather than return the exact request body stored in the storage layer a new request body is created and returned as follows
    ```
    {
        isAsync:true
    }
    ```
    The request is too heavy to process synchronously. Hence the request is shifted to asynchronous execution and the with the modified request body the shifting is informed to the server endpoint that is waiting for the request. (The server endpoint should have the knowledge of ``` isAsync:true```)

3. **`handleHeavyResponseBody: (id: string, content: Buffer, contentType: string | null) => String`**

    Since the response is too large to send back, rather than sending everything, upload a summarized version of it to the storage layer and shared the signed URL of it. 

4. **`terminate: (id: string, terminationCode:string) => void`**\
    Similar to the default implementation.