import { SecretsManagerClient, GetSecretValueCommandOutput } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParameterCommandOutput } from '@aws-sdk/client-ssm'; // ES Modules import
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as Dotenv from 'dotenv';
import { mockClient } from 'jest-aws-client-mock';
import { MtlsAuthenticator } from '../src/mlts-authenticator';
import { ConfigurableApiClient } from '../src/confiruable-api-client';

const secretsMock = mockClient(SecretsManagerClient);
const parameterStoreMock = mockClient(SSMClient);
const axiosMock = new MockAdapter(axios);

const apiClientName = 'TEST_CLIENT'

Dotenv.config();
if (process.env.VERBOSETESTS!='True') {
  global.console.error = jest.fn();
  global.console.time = jest.fn();
  global.console.log = jest.fn();

  // Setup test for mtls authenticator
  process.env.TEST_CLIENT_PRIVATE_KEY_ARN = 'testarn';
  process.env.TEST_CLIENT_CERT_SSM_NAME = 'testcert';
  process.env.TEST_CLIENT_ROOT_CERT_SSM_NAME = 'testca';

  // Setup test for api-key authenticator
  process.env.TEST_CLIENT_API_KEY = 'test-api-key';
  process.env.TEST_CLIENT_API_KEY_HEADER = 'Authorization';

  // Setup test for aws4-signature authenticator
  process.env.TEST_CLIENT_ACCESS_KEY_ID = 'abc';
  process.env.TEST_CLIENT_SECRET_KEY = 'secret';

}

beforeEach(() => {
  secretsMock.mockReset();
  parameterStoreMock.mockReset();
  axiosMock.reset();
});

describe('Init', () => {
  test('Init succeeds', async () => {
    //required env params:

    const secretsOutput: GetSecretValueCommandOutput = {
      $metadata: {},
      SecretString: 'test',
    };
    secretsMock.mockImplementation(() => secretsOutput);
    const ssmOutput: GetParameterCommandOutput = {
      $metadata: {},
      Parameter: {
        Value: 'test',
      },
    };
    secretsMock.mockImplementation(() => secretsOutput);
    parameterStoreMock.mockImplementation(() => ssmOutput);

    const apiClient = new ConfigurableApiClient(apiClientName, {}, new MtlsAuthenticator());
    await apiClient.init();
  });

  test('Error getting secret', async () => {
    //required env params:
    process.env.MTLS_PRIVATE_KEY_ARN = 'testarn';

    const secretsOutput: GetSecretValueCommandOutput = {
      $metadata: {},
    };
    secretsMock.mockImplementation(() => secretsOutput);
    const ssmOutput: GetParameterCommandOutput = {
      $metadata: {},
      Parameter: {
        Value: 'test',
      },
    };
    secretsMock.mockImplementation(() => secretsOutput);
    parameterStoreMock.mockImplementation(() => ssmOutput);

    const apiClient = new ConfigurableApiClient(apiClientName, {}, new MtlsAuthenticator());
    return expect(async () => {
      return apiClient.init();
    }).rejects.toThrow();
  });
  test('Without secret arn fails', async () => {
    //required env params:
    process.env.MTLS_PRIVATE_KEY_ARN = 'testarn';

    const secretsOutput: GetSecretValueCommandOutput = {
      $metadata: {},
    };
    secretsMock.mockImplementation(() => secretsOutput);
    const ssmOutput: GetParameterCommandOutput = {
      $metadata: {},
      Parameter: {
        Value: 'test',
      },
    };
    secretsMock.mockImplementation(() => secretsOutput);
    parameterStoreMock.mockImplementation(() => ssmOutput);

    const apiClient = new ConfigurableApiClient(apiClientName, {}, new MtlsAuthenticator());
    return expect(async () => {
      return apiClient.init();
    }).rejects.toThrow();
  });
});


describe('Requests', () => {
  test('Return data', async () => {
    //required env params:
    testSetup();
    const returnData = { users: [{ id: 1, name: 'John Smith' }] };
    axiosMock.onGet('/test').reply(200, returnData);
    

    const apiClient = new ConfigurableApiClient(apiClientName, {}, new MtlsAuthenticator());
    await apiClient.init();
    const data = await apiClient.requestData({ method: 'GET', url: '/test', data: 'test ' });
    expect(data).toEqual(returnData);
  });

  test('Timeout', async () => {
    //required env params:
    testSetup();
    axiosMock.onPost('/test').timeout();

    const apiClient = new ConfigurableApiClient(apiClientName, {}, new MtlsAuthenticator());
    await apiClient.init();
    return expect(async() => {
      await apiClient.requestData({ url: '/test', data: 'test ' });
    }).rejects.toThrow();
    let result: any;
    try {
      await apiClient.requestData({ url: '/test', data: 'test ' });
    } catch (error) {
      result = error;
    }
    expect(result.message).toBe('Het ophalen van gegevens is misgegaan.');
  });

  test('Network error', async () => {
    //required env params:
    testSetup();
    axiosMock.onPost('/test').networkError();

    const apiClient = new ConfigurableApiClient(apiClientName, {}, new MtlsAuthenticator());
    await apiClient.init();
    return expect(async() => {
      await apiClient.requestData({url: '/test', data: 'test ' });
    }).rejects.toThrow();
    let result: any;
    try {
      await apiClient.requestData( {url: '/test', data: 'test ' });
    } catch (error) {
      result = error;
    }
    expect(result.message).toBe('Het ophalen van gegevens is misgegaan.');
  });
});


function testSetup() {
  process.env.TEST_CLIENT_PRIVATE_KEY_ARN = 'testarn';

  const secretsOutput: GetSecretValueCommandOutput = {
    $metadata: {},
    SecretString: 'test',
  };
  secretsMock.mockImplementation(() => secretsOutput);
  const ssmOutput: GetParameterCommandOutput = {
    $metadata: {},
    Parameter: {
      Value: 'test',
    },
  };

  secretsMock.mockImplementation(() => secretsOutput);
  parameterStoreMock.mockImplementation(() => ssmOutput);
}