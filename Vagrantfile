# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  # lets us debian jessie amd64 as base.
  config.vm.box = "debian/jessie64"

  # salt should do the provisioning!
  config.vm.synced_folder ".saltstack/salt/", "/srv/salt/", type: "rsync"
  config.vm.synced_folder ".saltstack/pillar/", "/srv/pillar/", type: "rsync"

  config.vm.provision :shell, :inline => "sudo apt-get -y install git-core"
  config.vm.provision :shell, :inline => "sudo apt-get -y install python-setuptools"
  config.vm.provision :shell, :inline => "sudo easy_install GitPython"

  config.vm.provision :salt do |salt|
    # Workaround for:
    # Copying salt minion config to /etc/salt
    # Failed to upload a file to the guest VM via SCP due to a permissions
    # error. [...]; @see:
    # https://github.com/mitchellh/vagrant/issues/5973#issuecomment-137276605
    salt.bootstrap_options = '-F -c /tmp/ -P'
    salt.masterless = true
    salt.minion_config = ".saltstack/minion"
    salt.run_highstate = true
  end

  config.vm.synced_folder ".", "/vagrant", type: "rsync",
    rsync__exclude: [".git/", ".saltstack", "node_modules", "doc"]

end
