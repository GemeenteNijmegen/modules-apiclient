const { typescript } = require('projen');
const { NpmAccess } = require('projen/lib/javascript');

const projectName = '@gemeentenijmegen/apiclient';

const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: projectName,
  defaultReleaseBranch: 'main',
  license: 'EUPL-1.2',
  release: true,
  releaseToNpm: true,
  npmAccess: NpmAccess.PUBLIC,
  deps: [
    '@aws-sdk/client-secrets-manager',
    '@aws-sdk/client-ssm',
    'axios',
  ], /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: [
    'dotenv',
    'axios-mock-adapter',
    'jest-aws-client-mock',
  ], /* Build dependencies for this module. */
  packageName: projectName, /* The "name" in package.json. */
});
project.synth();