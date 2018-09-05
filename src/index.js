'use strict';

var os = require('os');
var path = require('path');

var co = require('co');
var npminstall = require('npminstall');
var pkg = require('../package.json');
var defaultPlugins = [
    'init'
];

module.exports = {
    command: 'install [plugins...]',
    description: pkg.description,
    options: [
        [ '-r, --registry [registry]', 'change npm registry', 'https://registry.npm.taobao.org' ]
    ],
    action: function(plugins, options) {
        var wiwiVersion = this.parent._version;
        if (!plugins.length) {
            plugins = defaultPlugins;
        }

         // check user
        if (process.getuid && process.getuid() === 0) {
            console.log('Please DO NOT run wiwi install as root!');
            console.log('You can run "sudo chmod 777 `npm root -g`" to have write permission.')
            process.exit();
        }

         // npminstall config
        var config = {
            root: process.cwd(),
            pkgs: plugins.map(function(plugin) {
                return {
                    name: !/^wiwi\-/.test(plugin) ? 'wiwi-' + plugin : plugin,
                    version: wiwiVersion.split('.')[0]
                };
            })
        };
        console.log('Installing ' + config.pkgs.map(function(pkg) {
            return pkg.name;
        }).join(' ') + ' ...');

        if (options.registry) {
            config.registry = options.registry;
      
            // force build fsevent locally
            if (process.platform === 'darwin') {
              process.env.npm_config_fse_binary_host_mirror = 'http://127.0.0.1';
            }
        }

        // set peer install dir
        var npmPrefix = path.join(this.parent._moduleDirs[1], '..');
        config.targetDir = npmPrefix;
        config.binDir = path.join(os.homedir(), '.wiwi', 'install', '.bin');
        config.storeDir = path.join(os.homedir(), '.wiwi', 'install');

        // run npm install
        co(function*() {
            yield npminstall(config);
        }).catch(function(err) {
            console.log(err.stack)
        });

    }
};