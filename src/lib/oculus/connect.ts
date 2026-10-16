import type { OculusBridge } from './bridge';

const bridgeModule = '/apps/-/oculus.js';

export async function connectBridge(): Promise<OculusBridge> {
    const loaded = (await import(/* @vite-ignore */ bridgeModule)) as {
        connect(): Promise<OculusBridge>;
    };
    return loaded.connect();
}
