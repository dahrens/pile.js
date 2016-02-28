grunt-cli:
  npm.installed:
    require:
      - sls: node


/vagrant:
  npm.bootstrap:
    require:
      - pkg: grunt-cli
