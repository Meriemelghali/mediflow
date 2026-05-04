const { Eureka } = require('eureka-js-client');

const PORT = parseInt(process.env.PORT, 10) || 8081;

const client = new Eureka({
  instance: {
    app: 'user-service',
    instanceId: `user-service:${PORT}`,
    hostName: 'localhost',
    ipAddr: '127.0.0.1',
    port: { '$': PORT, '@enabled': true },
    vipAddress: 'user-service',
    statusPageUrl: `http://localhost:${PORT}/info`,
    healthCheckUrl: `http://localhost:${PORT}/health`,
    homePageUrl: `http://localhost:${PORT}/`,
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    },
  },
  eureka: {
    host: 'localhost',
    port: 8761,
    servicePath: '/eureka/apps/',
  },
});

const registerWithEureka = () => {
  client.start((err) => {
    if (err) {
      console.error('❌ Eureka registration failed:', err.message);
    } else {
      console.log('✅ Registered with Eureka as user-service');
    }
  });
};

const deregisterFromEureka = () => {
  client.stop(() => console.log('👋 Deregistered from Eureka'));
};

module.exports = { registerWithEureka, deregisterFromEureka };