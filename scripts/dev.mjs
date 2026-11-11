// Starts the website (Vite) and the backend together. Press Ctrl+C once to stop both.
import { spawn } from "node:child_process";

const tasks = [
  { name: "client", command: "npm run dev:client" },
  { name: "server", command: "npm run dev:server" },
];

const children = tasks.map(({ name, command }) => {
  const child = spawn(command, { stdio: "inherit", shell: true });
  child.on("exit", (code) => {
    if (!stopping) {
      console.error(`\n[${name}] stopped (exit code ${code}). Stopping everything.`);
      stopAll();
      process.exitCode = code ?? 1;
    }
  });
  return child;
});

let stopping = false;
function stopAll() {
  stopping = true;
  for (const child of children) child.kill();
}
process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);
