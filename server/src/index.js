import { loadConfig, ConfigError } from "./config.js";
import { createApp } from "./app.js";

let config;
try {
  config = loadConfig();
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(`\n${error.message}\n`);
    process.exit(1);
  }
  throw error;
}

createApp(config).listen(config.port, () => {
  const mode = config.isProduction ? "production" : "development";
  console.log(`Server running on http://localhost:${config.port} (${mode})`);
});
