import https from 'https';
import { AWS } from '@gemeentenijmegen/utils';
import axios, { AxiosError, AxiosInstance } from 'axios';

export class ApiClient {

  /**
   * Helper function for creating an ApiClient from obtaining
   * certificate, ca and private key from the AWS parameter store
   * and secrets manager.
   * @param ssmCert ssm name of the cert parameter
   * @param ssmCa ssm name of the CA parameter
   * @param arnKey ARN of the private key secret
   * @returns
   */
  static async fromParameterStore(
    ssmCert: string,
    ssmCa: string,
    arnKey: string,
  ) {
    const [cert, ca, key] = await Promise.all([
      AWS.getParameter(ssmCert),
      AWS.getParameter(ssmCa),
      AWS.getSecret(arnKey),
    ]);
    return new ApiClient(cert, ca, key);
  }

  private privatekey: string | undefined;
  private certname: string | undefined;
  private caname: string | undefined;
  private cert: string | undefined;
  private ca: string | undefined;
  private axios: AxiosInstance;
  private timeout: number = 2000;
  /**
   * Connects to API's. Use .post() or .get() to get the actual info
   *
   * @param {string|null} cert optional client cert, default is env variable MTLS_CLIENT_CERT
   * @param {string|null} key optional private key for client cert, default will get key from secret store
   * @param {string|null} ca optional root ca bundle to trust, default is env variable MTLS_ROOT_CA
  */
  constructor(cert?: string, key?: string, ca?: string, axiosInstance?: AxiosInstance) {
    this.privatekey = key;
    this.cert = cert;
    this.ca = ca;
    this.certname = process.env.MTLS_CLIENT_CERT_NAME ?? undefined;
    this.caname = process.env.MTLS_ROOT_CA_NAME ?? undefined;
    this.axios = this.initAxios({ axiosInstance });
  }

  private initAxios(config: {
    axiosInstance?: AxiosInstance | undefined;
  }): AxiosInstance {
    if (config.axiosInstance) {
      return config.axiosInstance;
    } else {
      return axios.create();
    }
  }

  setTimeout(timeout: number) {
    this.timeout = timeout;
  }

  /**
   * Init key, cert and ca. If you do not init, you can pass them in the constructor, or
   * they will be lazily initialized in the first requestData call
   */
  async init() {
    if (!(this.certname && this.caname) && !(this.cert && this.ca)) {
      throw Error('client certificate and CA, or ssm parameter names must be provided');
    }

    this.privatekey = await this.getPrivateKey();
    if (this.certname && this.caname) {
      this.cert = this.cert ? this.cert : await AWS.getParameter(this.certname);
      this.ca = this.ca ? this.ca : await AWS.getParameter(this.caname);
    }
  }

  /**
   * Retrieve certificate private key from secrets manager
   *
   * @returns string private key
   */
  async getPrivateKey() {
    if (!this.privatekey) {
      if (!process.env.MTLS_PRIVATE_KEY_ARN) {
        throw new Error('no secret arn provided');
      }
      this.privatekey = await AWS.getSecret(process.env.MTLS_PRIVATE_KEY_ARN);
      if (!this.privatekey) {
        throw new Error('No secret value found');
      }
    }
    return this.privatekey;
  }

  /**
   * Request data from the API.
   *
   * @deprecated This method always performs a POST request. The `postData()` method is
   * a drop-in replacement for requestData. For get, use `getData()`.
   *
   * @returns {string} api response
   */
  async requestData(endpoint: string, body: any, headers?: any): Promise<any> {
    return this.postData(endpoint, body, headers);
  }

  async postData(endpoint: string, body: any, headers?: any): Promise<any> {
    const httpsAgent = await this.setupAgent();
    console.time('request to ' + endpoint);
    try {
      const response = await this.axios.post(endpoint, body, {
        httpsAgent: httpsAgent,
        headers,
        timeout: this.timeout,
      });
      console.timeEnd('request to ' + endpoint);
      return response.data;
    } catch (error: any | AxiosError) {
      console.timeEnd('request to ' + endpoint);
      this.handleErrors(error, endpoint);
    }
  }

  async getData(endpoint: string, headers?: any): Promise<any> {
    const httpsAgent = await this.setupAgent();
    console.time('GET request to ' + endpoint);
    try {
      const response = await this.axios.get(endpoint, {
        httpsAgent: httpsAgent,
        headers,
        timeout: this.timeout,
      });
      console.timeEnd('GET request to ' + endpoint);
      return response.data;
    } catch (error: any | AxiosError) {
      console.timeEnd('GET request to ' + endpoint);
      this.handleErrors(error, endpoint);
    }
  }

  private handleErrors(error: any, endpoint: string) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('http status for ' + endpoint + ': ' + error.response.status);
      } else if (error?.code === 'ECONNABORTED') {
        // Check for a timeout
        throw new Error('Het ophalen van gegevens duurt te lang.');
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.error(error?.code);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(error.message);
      }
    } else {
      console.error(error.message);
    }

    throw new Error('Het ophalen van gegevens is misgegaan.');
  }

  async setupAgent() {
    if (!this.cert || !this.ca) {
      await this.init();
    }
    if (!this.cert || !this.ca) {
      throw Error('Error setting cert or CA');
    }
    const key = await this.getPrivateKey();
    const cert = this.cert;
    const ca = this.ca;
    const httpsAgent = new https.Agent({ cert, key, ca });
    return httpsAgent;
  }
}
