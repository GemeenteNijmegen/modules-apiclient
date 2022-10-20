import { Axios, AxiosRequestConfig } from 'axios';
import { ApiClientAuthenticator } from './confiruable-api-client';
import { AwsUtility } from './aws-utility';
import { aws4Interceptor } from 'aws4-axios';


export class Aws4SignatureAuthenticator extends ApiClientAuthenticator {

  private accessKeyId?: string;
  private secretKey?: string;
  private region: string;
  private service: string;

  /**
   * Connects to API's. Use .requestData() to get the actual info
   *
   * @param {string|null} accessKeyId aws4 signature secret key id 
   * @param {string|null} secretKey optional private key for client cert, default will get key from secret store
  */
  constructor(accessKeyId?: string, secretKey?: string, region?: string, service?: string) {
    super();
    this.accessKeyId = accessKeyId;
    this.secretKey = secretKey;
    this.region = region ?? 'eu-west-1';
    this.service = service ?? 'execute-api';
  }

  async init(envVariablePrefix: string) {
    const util = new AwsUtility();

    if (!this.accessKeyId){
      const envVarAccessKeyId = `${envVariablePrefix}_ACCESS_KEY_ID`;
      this.accessKeyId = await util.getSecretValue(process.env[envVarAccessKeyId]);
    }
    
    if (!this.secretKey){
      const envVarSecretKey = `${envVariablePrefix}_SECRET_KEY`;
      this.secretKey = await util.getSecretValue(process.env[envVarSecretKey]);
    }

  }

  configureClient(axios: Axios): Axios {
    if(!this.accessKeyId || !this.secretKey){
      throw Error("AWS4 signature authenticator is not initialized.");
    }

    const credentials = {
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretKey,
    };

    const interceptor = aws4Interceptor({
      region: this.region,
      service: this.service,
    }, credentials);

    axios.interceptors.request.use(interceptor);
    return axios;
  }

  configureRequest(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
    return config;
  }

  

}