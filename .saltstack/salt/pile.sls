# use node formula to ship node
# see pillar/node.sls
include:
  - node

# redis
install_redis_pkg:
  pkg.installed:
    - pkgs: [redis-server, redis-tools]

# npm is already available by node-formula, however we need this to
# be able to use the npm states shipped with salt on first provisioing run.
#
# As this is *not* working:
# - require:
#   - sls: node
#
npm:
  pkg.installed

# install grunt
grunt-cli:
  npm.installed:
    - require:
      - pkg: npm

# npm i
/vagrant:
  npm.bootstrap:
    - require:
      - npm: grunt-cli

# initially build everything, so docs and code coverage is available in the box.
grunt build:
  cmd.run:
    - cwd: /vagrant
    - require:
      - npm: /vagrant

# nginx serves the docs and test coverage pages.
nginx:
  pkg:
    - installed
  service:
    - running
    - watch:
      - file: /etc/nginx/sites-available/default

/etc/nginx/sites-available/default:
  file:
    - managed
    - contents:
      - server { listen 80 default_server; root /vagrant/doc/; server_name _; location / { autoindex on; }}
    - require:
      - cmd: grunt build
      - pkg: nginx
