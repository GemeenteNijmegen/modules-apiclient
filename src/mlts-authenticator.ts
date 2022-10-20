import https from 'https';
import { Axios, AxiosRequestConfig } from 'axios';
import { ApiClientAuthenticator } from './confiruable-api-client';
import { AwsUtility } from './aws-utility';

export class MtlsAuthenticator extends ApiClientAuthenticator {

  private privatekey: string | undefined;
  private certname: string | undefined;
  private caname: string | undefined;
  private cert: string | undefined;
  private ca: string | undefined;

  /**
   * Connects to API's. Use .requestData() to get the actual info
   *
   * @param {string|null} cert optional client cert, default is env variable MTLS_CLIENT_CERT
   * @param {string|null} key optional private key for client cert, default will get key from secret store
   * @param {string|null} ca optional root ca bundle to trust, default is env variable MTLS_ROOT_CA
  */
  constructor(cert?: string, key?: string, ca?: string) {
    super();
    this.privatekey = key;
    this.cert = cert;
    this.ca = ca;    
  }

  /**
   * Init key, cert and ca. If you do not init, you can pass them in the constructor, or
   * they will be lazily initialized in the first requestData call
   */
  async init(envVariablePrefix: string) {
    const util = new AwsUtility();

    const envVarCertSsmName = `${envVariablePrefix}_CERT_SSM_NAME`;
    const envVarRootCertSsmName = `${envVariablePrefix}_ROOT_CERT_SSM_NAME`;
    this.certname = process.env[envVarCertSsmName] ?? undefined;
    this.caname = process.env[envVarRootCertSsmName] ?? undefined;

    if (!(this.certname && this.caname) && !(this.cert && this.ca)) {
      throw Error('client certificate and CA, or ssm parameter names must be provided');
    }

    if (!this.privatekey) {
      const envVarPrivateKeyArn = `${envVariablePrefix}_PRIVATE_KEY_ARN`;
      this.privatekey = await util.getSecretValue(process.env[envVarPrivateKeyArn]);
    }

    if (this.certname && this.caname) {
      this.cert = this.cert ? this.cert : await util.getParameterValue(this.certname);
      this.ca = this.ca ? this.ca : await util.getParameterValue(this.caname);
    }
  }

  configureClient(axios: Axios): Axios {
    return axios;
  }


  configureRequest(config: AxiosRequestConfig<any>): AxiosRequestConfig<any> {
    if (!this.cert || !this.ca || !this.privatekey) {
      throw Error('Not initialized!');
    }

    const httpsAgent = new https.Agent({ 
      cert: this.cert, 
      key: this.privatekey, 
      ca: this.ca 
    });
    
    return {
      ...config,
      httpsAgent,
    }
  }

}