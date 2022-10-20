import { Axios, AxiosRequestConfig } from 'axios';
import { ApiClientAuthenticator } from './confiruable-api-client';
import { AwsUtility } from './aws-utility';


export class ApiKeyAuthenticator extends ApiClientAuthenticator {

  private apiKey?: string;
  private headerName?: string;

  /**
   * Connects to API's. Use .requestData() to get the actual info
   *
   * @param {string|null} accessKeyId aws4 signature secret key id 
   * @param {string|null} secretKey optional private key for client cert, default will get key from secret store
  */
  constructor(apiKey?: string, headerName?: string) {
    super();
    this.apiKey = apiKey;
    this.headerName = headerName;
  }

  async init(envVariablePrefix: string) {
    const util = new AwsUtility();

    if (!this.apiKey){
      const envVarApiKey = `${envVariablePrefix}_API_KEY`;
      this.apiKey = await util.getSecretValue(process.env[envVarApiKey]);
    }
    
    if (!this.headerName){
      const envVarApiKeyHeader = `${envVariablePrefix}_API_KEY_HEADER`;
      this.headerName = await util.getParameterValue(process.env[envVarApiKeyHeader]);
    }

  }

  configureClient(axios: Axios): Axios {
    return axios;
  }

  configureRequest(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
    if(!this.headerName || !this.apiKey){
      throw Error("not configured properly");
    }

    return {
      ...config,
      headers: {
        ...config.headers,
        [this.headerName]: this.apiKey,
      }
    }
  }

  

}