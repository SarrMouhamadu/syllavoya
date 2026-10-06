import "temporal-polyfill/full/global";
import { app } from "./app.js";
import { config } from "./config/env.js";

app.listen(config.port, "0.0.0.0", () => {
  console.log(`API running on http://localhost:${config.port}`);
});
