# config autoreload

Basic autoreload wrapper for `config` module. Allows to change server configuration without restarting the app.

## Usage example
```js
const config = require('@rainder/config');

const CONFIG = config.autoload({
  password: 'server.password'
});

config.on('reload', () => {
  console.log('config file is changed!');
  
  //credentials are updated
  console.log(CONFIG.password);
  
  //standard way of retrieving config is supported
  //even though less preferable
  console.log(config.get('server.password'));  
});

```