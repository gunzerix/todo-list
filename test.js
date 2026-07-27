/**
 * Minimal smoke test (no test framework needed, keeps CI simple & dependency-free).
 * Boots the server, hits /health, checks response, then exits.
 */
process.env.DB_PATH = './data/test.db';
process.env.PORT = 4321;

const http = require('http');
const app = require('./server');

const server = app.listen(process.env.PORT, () => {
  http.get(`http://localhost:${process.env.PORT}/health`, (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      const json = JSON.parse(body);
      if (res.statusCode === 200 && json.status === 'ok') {
        console.log('✅ Health check test passed');
        server.close(() => process.exit(0));
      } else {
        console.error('❌ Health check test failed', res.statusCode, body);
        server.close(() => process.exit(1));
      }
    });
  }).on('error', (err) => {
    console.error('❌ Request failed', err);
    process.exit(1);
  });
});
