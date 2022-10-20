import axios, { Axios, AxiosError, AxiosRequestConfig } from 'axios';

export interface ErrorResponse {
  message: string;
}

export abstract class ApiClientAuthenticator {
  abstract init(envVariablePrefix: string): Promise<void>;
  abstract configureClient(axios: Axios): Axios;
  abstract configureRequest(config: AxiosRequestConfig): AxiosRequestConfig;
}

export class ConfigurableApiClient {

  private defaultRequestConfig?: AxiosRequestConfig;
  private authenticators: ApiClientAuthenticator[];
  private readonly envVariablePrefix: string;

  constructor(envVariablePrefix: string, defaultRequestConfig?: AxiosRequestConfig, ...authenticators: ApiClientAuthenticator[]) {
    this.envVariablePrefix = envVariablePrefix;
    this.defaultRequestConfig = defaultRequestConfig;
    this.authenticators = authenticators;
  }

  /**
   * Initializes all provided authenticators
   */
  async init() {
    for (let a of this.authenticators) {
      await a.init(this.envVariablePrefix);
    }
  }

  /**
   * Enable all authenticators to configure the axios client
   */
  private createClient() {
    const client = new Axios();
    for (let a of this.authenticators) {
      a.configureClient(client);
    }
    return client;
  }

  /**
   * Enable all authenticators to configure the axios requrst
   * @param request AxiosRequestConfig to be configured
   * @returns 
   */
  private configureRequest(request: AxiosRequestConfig) {
    let configuredRequest = {
      ...this.defaultRequestConfig,
      ...request,
    }
    for (let a of this.authenticators) {
      configuredRequest = a.configureRequest(configuredRequest);
    }
    return request;
  }

  /**
   * Request data from the API.
   * @returns {string} api response
   */
  async requestData<T>(request: AxiosRequestConfig): Promise<ErrorResponse | T> {
    const client = this.createClient();
    const authenticatedRequest = this.configureRequest(request);

    console.time('request to ' + request.url);
    try {
      const response = await client.request(authenticatedRequest);
      console.timeEnd('request to ' + request.url);
      return response.data;
    } catch (error: any | AxiosError) {

      console.timeEnd('request to ' + request.url);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log('http status for ' + request.url + ': ' + error.response.status);
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
  }

}