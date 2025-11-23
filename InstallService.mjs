import {Service} from 'node-windows'

// Create a new service object
var svc = new Service({
  name:'NodeServer - DigitalGarden',
  description: 'Digital Garden Backend node server',
  script: 'C:\\inetpub\\wwwroot\\DigitalGarden\\Backend.mjs',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
  //, workingDirectory: '...'
  //, allowServiceLogon: true
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();