import 'dotenv/config';
import { config } from './config/index.js';
import app from './app.js';

app.listen(config.port, () => {
  console.log(`RP API listening on port ${config.port}`);
});
