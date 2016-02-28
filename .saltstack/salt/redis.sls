install_redis_pkg:
  pkg.installed:
    - pkgs: [redis-server, redis-tools]
