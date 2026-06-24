import { spawnSync } from 'node:child_process';
import net from 'node:net';

const containerName = 'retail-insight-integration-postgres';
const host = '127.0.0.1';
const port = 55433;
const database = 'retail_insight_integration_test';
const defaultDatabaseUrl = `postgresql://postgres:postgres@${host}:${port}/${database}?schema=public`;
const databaseUrl = process.env.TEST_DATABASE_URL ?? defaultDatabaseUrl;
const parsedDatabaseUrl = new URL(databaseUrl);
const databaseHost = parsedDatabaseUrl.hostname;
const databasePort = Number(parsedDatabaseUrl.port || 5432);

function assertTestDatabase(url) {
  const databaseName = new URL(url).pathname.slice(1);

  if (!databaseName.includes('test')) {
    throw new Error(
      `Refusing to run integration tests against non-test database "${databaseName}"`,
    );
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runResult(command, args, options = {}) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });
}

function docker(args) {
  return spawnSync('docker', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function ensureDockerPostgres() {
  if (process.env.TEST_DATABASE_URL) {
    return;
  }

  const existing = docker(['ps', '-a', '--filter', `name=^/${containerName}$`, '--format', '{{.Names}}']);

  if (existing.status !== 0) {
    process.stderr.write(existing.stderr);
    process.exit(existing.status ?? 1);
  }

  if (existing.stdout.trim() === containerName) {
    run('docker', ['start', containerName]);
    return;
  }

  run('docker', [
    'run',
    '--detach',
    '--name',
    containerName,
    '--publish',
    `${host}:${port}:5432`,
    '--env',
    'POSTGRES_USER=postgres',
    '--env',
    'POSTGRES_PASSWORD=postgres',
    '--env',
    `POSTGRES_DB=${database}`,
    'postgres:16-alpine',
  ]);
}

function waitForPort() {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.createConnection({ host: databaseHost, port: databasePort }, () => {
        socket.end();
        resolve();
      });

      socket.on('error', () => {
        socket.destroy();

        if (Date.now() - startedAt > 30_000) {
          reject(new Error(`Timed out waiting for PostgreSQL on ${databaseHost}:${databasePort}`));
          return;
        }

        setTimeout(attempt, 500);
      });
    };

    attempt();
  });
}

async function runWithRetry(command, args, options = {}) {
  let lastStatus = 1;

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const result = runResult(command, args, options);

    if (result.status === 0) {
      return;
    }

    lastStatus = result.status ?? 1;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  process.exit(lastStatus);
}

assertTestDatabase(databaseUrl);
ensureDockerPostgres();
await waitForPort();

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
};

await runWithRetry('pnpm', ['--filter', '@retail-insight/api', 'exec', 'prisma', 'migrate', 'deploy'], {
  env,
});
run('pnpm', ['vitest', 'run', '--config', 'vitest.integration.config.ts'], {
  env,
});
