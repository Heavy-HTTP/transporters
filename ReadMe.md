# Transporter

Heavy HTTP is designed to overcome the payload limitations in Rest HTTP communication. In simple terms Heavy HTTP allows client and Servers to share unlimited amount of data within a single request-response flow. For that Heavy HTTP relais on an alternative communication protocol backed by a temporary or permenent storage. Interestingly Heavy HTTP can realy on any storage mechanism as far as the storage mechanism agrees with the communication protocol. 

In order to agree with the communication protocol the storage mechanism must have following capabilities. 

1. Upload content via Signed URLs (PUT method)
2. Download content via Signed URLS (GET method)

Transporter is the interface that hooks the storage mechanism with the Heavy HTTP Server connector so that Heavy HTTP can perform its magic. In addition to that the Transporter provides much opportunity for developer to control the behaviour of the heavy request and responses. 


## Transporter Interface 

 The generic transporter interface is always common across all the languages/run-times. Based on the language the syntax is varied. Please refer the related run-time/language Heavy HTTP Server connector to learn the exact method signatures of the interface. 

	```
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

	```

## Default Implementation of Transporter Interface 

As it is mentioned in the beginning the primary goal of the transporter interface is to hook the storage layer with the Heavy HTTP Server connector. Hence a default implementation of Transpoter interface must fulfill that requirment. 


1. **`generateUploadURL: (id: string) => String`**\
    This method is invoked at the begining of a Heavy HTTP request. When the Heavy HTTP Client requests signed url from Heavy HTTP Server connector, the server connector invokes this method by providing a unique id. And this method should return a signed url that can be utilized to upload the request body. The uploaded content must be uniquly identifiable by the unique id shared with this method. 

2. **`injectHeavyRequestBody: (id: string) => PayloadResponse`**\
    Once request is uploaded to the storage layer, this method is invoked by the server. The expectation of the method is to fetch the request body from the storgae mechanism and return it to the Heavy HTTP Server connector so that connector can append that to the ongoing request body. 

3. **`handleHeavyResponseBody: (id: string, content: Buffer, contentType: string | null) => String`**\
    If the response body is larger than the configured response threshold this method is executed. Heavy HTTP Server connector invoke the method with the response body, content type and a unique id with the expectation of a signed url to download the content. So the implementation must support that behaviour.

4. **`terminate: (id: string, terminationCode:string) => void`**\
    At the end of every Heavy HTTP communication flow this method is triggered. There are multiple path that a communication can occure and based on the communication flow and events the termination code is decided. 
    
    **Termination Codes**\
    a. dsd
    b. sdsds
    c.sdsdsd
    d. sdsdsd

    Then default behaviour is to delete the content from the storage layer when this method is invoked.