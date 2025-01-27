const { GemeenteNijmegenTsPackage } = require('@gemeentenijmegen/projen-project-type');

const projectName = '@gemeentenijmegen/apiclient';

const project = new GemeenteNijmegenTsPackage({
  defaultReleaseBranch: 'main',
  name: projectName,
  repository: 'https://github.com/GemeenteNijmegen/modules-apiclient.git',
  defaultReleaseBranch: 'main',
  depsUpgradeOptions: {
    workflowOptions: {
      branches: ['main'], // No acceptance branche
    },
  },
  deps: [
    '@gemeentenijmegen/utils',
    'axios',
  ],
  devDeps: [
    'dotenv',
    'axios-mock-adapter',
    'jest-aws-client-mock',
    '@gemeentenijmegen/projen-project-type',
  ],
  packageName: projectName,
  enableAutoMergeDependencies: false, // No acceptance branche
});
project.synth();
