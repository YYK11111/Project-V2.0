export interface MainAppConfig {
  server?: {
    port?: number | string;
  };
}

const defaultHttpPort = 3000;

function parseHttpPort(port: number | string | undefined): number {
  if (port === undefined || port === "") {
    return defaultHttpPort;
  }

  const parsedPort = Number(port);

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    return defaultHttpPort;
  }

  return parsedPort;
}

export function getHttpPort(appConfig: MainAppConfig): number {
  if (process.env.PORT !== undefined) {
    return parseHttpPort(process.env.PORT);
  }

  return parseHttpPort(appConfig.server?.port);
}
