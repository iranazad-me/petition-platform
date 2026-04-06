import fetch from 'node-fetch';

const port = process.env.PORT || 3000;
const url = `http://localhost:${port}/api/ready`;

try {
  const response = await fetch(url);
  process.exit(response.ok ? 0 : 1);
} catch {
  process.exit(1);
}
