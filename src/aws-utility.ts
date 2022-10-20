import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'; // ES Modules import

export class AwsUtility {

    /**
     * Retrieve secret value from the secret manager
     * @returns string secret
     */
    async getSecretValue(secretArn?: string) {
        if (!secretArn) {
            throw new Error('no secret arn provided');
        }
        const secretsManagerClient = new SecretsManagerClient({});
        const command = new GetSecretValueCommand({ SecretId: secretArn });
        const data = await secretsManagerClient.send(command);
        if (data?.SecretString) {
            return data.SecretString;
        }
        throw new Error('No secret value found for arn ' + secretArn);
    }

    /**
     * Get a parameter from parameter store. This is used
     * as a workaround for the 4kb limit for environment variables.
     *
     * @param {string} name Name of the ssm param
     * @returns param value
     */
    async getParameterValue(name?: string) {
        if(!name){
            throw new Error('no parameter name provided');
        }
        const client = new SSMClient({});
        const command = new GetParameterCommand({ Name: name });
        const response = await client.send(command);
        return response?.Parameter?.Value;
    }
}