# config autoreload

Basic autoreload wrapper for `config` module. Allows to change server configuration without restarting the app.

## Usage example
```js
const config = require('@rainder/config');

const CONFIG = config.init({
  PASSWORD: 'server.password',
  SSL: {
    ENABLE: 'server.ssl.enable',
  },
});

```
