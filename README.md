# Gemeente Nijmegen Api Client

An HTTP Api Client module. Used for applications requiring mutual TLS, backed by config in AWS.

## How to use
Quickstart:

Install using npm: 

```npm i @gemeentenijmegen/apiclient```

The client expects either the following environment parameters to be set, or to be provided a client certificate, private key and root ca:
```

```
  MTLS_PRIVATE_KEY_ARN // AWS Arn to the secrets manager ARN holding the private key
  MTLS_CLIENT_CERT_NAME // The name of an SSM parameter holding the client certificate 
  MTLS_ROOT_CA_NAME // The name of an SSM parameter holding the root ca

```
// create a client
const apiClient = new ApiClient();
// init (get parameters from store etc.)
await apiClient.init();
// Use the client to request data
const data = await apiClient.requestData('/test', { data: 'test ' },  {'Content-type': 'application/json'});
```
The request can throw an error, the actual message is logged, a generic Error is thrown.