import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.PORT ?? 4000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

app.listen(port, () => {
  console.log(`Backend listening on port ${port} Backend is running on http://localhost:${port}`);
});