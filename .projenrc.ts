import { GemeenteNijmegenTsPackage } from '@gemeentenijmegen/projen-project-type';

const projectName = '@gemeentenijmegen/apiclient';

const project = new GemeenteNijmegenTsPackage({
  defaultReleaseBranch: 'main',
  name: projectName,
  projenrcTs: true,
  repository: 'https://github.com/GemeenteNijmegen/modules-apiclient.git',
  depsUpgradeOptions: {
    workflowOptions: {
      branches: ['main'], // No acceptance branche
    },
  },
  deps: [
    '@aws-sdk/client-secrets-manager',
    '@gemeentenijmegen/utils',
    '@aws-sdk/client-ssm',
    'axios@1.18.1', //TODO; unpin. Issue axios 11116 in version 19.0, is being fixed
  ],
  devDeps: [
    'dotenv',
    'axios-mock-adapter',
    'jest-aws-client-mock',
    '@gemeentenijmegen/projen-project-type',
  ],
  packageName: projectName,
  enableAutoMergeDependencies: false, // No acceptance branche
  tsconfig: {
    compilerOptions: {
      lib: ['ES2020', 'DOM'], // Axios DOM types fix
    },
  },
});
project.synth();
