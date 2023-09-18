import { SecretsManagerClient, GetSecretValueCommandOutput } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParameterCommandOutput } from '@aws-sdk/client-ssm'; // ES Modules import
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as Dotenv from 'dotenv';
import { mockClient } from 'jest-aws-client-mock';
import { ApiClient } from '../src';

const axiosInstance = axios.create();
const apiClient = new ApiClient('cert', 'key', 'ca', axiosInstance);

const secretsMock = mockClient(SecretsManagerClient);
const parameterStoreMock = mockClient(SSMClient);
const axiosMock = new MockAdapter(axiosInstance);

Dotenv.config();
if (process.env.VERBOSETESTS!='True') {
  global.console.error = jest.fn();
  global.console.time = jest.fn();
  global.console.log = jest.fn();

  process.env.MTLS_PRIVATE_KEY_ARN = 'testarn';
  process.env.MTLS_CLIENT_CERT_NAME = 'testcert';
  process.env.MTLS_ROOT_CA_NAME = 'testca';
}

beforeAll( async () => {
  await apiClient.init();
});

beforeEach(() => {
  secretsMock.mockReset();
  parameterStoreMock.mockReset();
  axiosMock.reset();
});

describe('Init', () => {

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

    const apiClientForError = new ApiClient();
    return expect(async () => {
      return apiClientForError.init();
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

    const apiClientForSecretError = new ApiClient();
    return expect(async () => {
      return apiClientForSecretError.init();
    }).rejects.toThrow();
  });
});

describe('postData Requests', () => {
  test('Return data', async () => {
    //required env params:
    testSetup();
    const returnData = { users: [{ id: 1, name: 'John Smith' }] };
    axiosMock.onPost('/test').reply(200, returnData);

    const data = await apiClient.postData('/test', { data: 'test ' });
    expect(data).toEqual(returnData);
  });

  test('Timeout', async () => {
    //required env params:
    testSetup();
    axiosMock.onPost('/test').timeout();

    await expect(async() => {
      await apiClient.postData('/test', { data: 'test ' });
    }).rejects.toThrow();
    let result: any;
    try {
      await apiClient.postData('/test', { data: 'test ' });
    } catch (error) {
      result = error;
    }
    expect(result.message).toBe('Het ophalen van gegevens is misgegaan.');
  });

  test('Network error', async () => {
    //required env params:
    testSetup();
    axiosMock.onPost('/test').networkError();

    await expect(async() => {
      await apiClient.postData('/test', { data: 'test ' });
    }).rejects.toThrow();
    let result: any;
    try {
      await apiClient.postData('/test', { data: 'test ' });
    } catch (error) {
      result = error;
    }
    expect(result.message).toBe('Het ophalen van gegevens is misgegaan.');
  });

});

describe('Deprecated requestData Requests', () => {
  test('Return data', async () => {
    //required env params:
    testSetup();
    const returnData = { users: [{ id: 1, name: 'John Smith' }] };
    axiosMock.onPost('/test').reply(200, returnData);

    const data = await apiClient.postData('/test', { data: 'test ' });
    expect(data).toEqual(returnData);
  });

  test('Timeout', async () => {
    //required env params:
    testSetup();
    axiosMock.onPost('/test').timeout();

    await expect(async() => {
      await apiClient.postData('/test', { data: 'test ' });
    }).rejects.toThrow();
    let result: any;
    try {
      await apiClient.postData('/test', { data: 'test ' });
    } catch (error) {
      result = error;
    }
    expect(result.message).toBe('Het ophalen van gegevens is misgegaan.');
  });

  test('Network error', async () => {
    //required env params:
    testSetup();
    axiosMock.onPost('/test').networkError();

    await expect(async() => {
      await apiClient.postData('/test', { data: 'test ' });
    }).rejects.toThrow();
    let result: any;
    try {
      await apiClient.postData('/test', { data: 'test ' });
    } catch (error) {
      result = error;
    }
    expect(result.message).toBe('Het ophalen van gegevens is misgegaan.');
  });
});

describe('GET Requests', () => {
  test('Return data', async () => {
    //required env params:
    testSetup();
    const returnData = { users: [{ id: 1, name: 'John Smith' }] };
    axiosMock.onGet('/test').reply(200, returnData);

    const data = await apiClient.getData('/test');
    expect(data).toEqual(returnData);
  });

  test('Timeout', async () => {
    //required env params:
    testSetup();
    axiosMock.onGet('/test').timeout();

    await expect(async() => {
      await apiClient.getData('/test');
    }).rejects.toThrow();
    let result: any;
    try {
      await apiClient.getData('/test', { data: 'test ' });
    } catch (error) {
      result = error;
    }
    expect(result.message).toBe('Het ophalen van gegevens is misgegaan.');
  });

  test('Network error', async () => {
    //required env params:
    testSetup();
    axiosMock.onGet('/test').networkError();

    await expect(async() => {
      await apiClient.getData('/test', { data: 'test ' });
    }).rejects.toThrow();
    let result: any;
    try {
      await apiClient.getData('/test', { data: 'test ' });
    } catch (error) {
      result = error;
    }
    expect(result.message).toBe('Het ophalen van gegevens is misgegaan.');
  });
});


function testSetup() {
  process.env.MTLS_PRIVATE_KEY_ARN = 'testarn';

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
