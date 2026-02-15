import { onRequest } from 'firebase-functions/v2/https';

let ssrApp;
async function getApp() {
  if (!ssrApp) {
    ssrApp = await import('./dist/server/server.mjs');
  }
  return ssrApp.reqHandler;
}

export const ssr = onRequest(
  { region: 'europe-west6', memory: '512MiB', timeoutSeconds: 60 },
  async (req, res) => {
    const handler = await getApp();
    handler(req, res);
  }
);
