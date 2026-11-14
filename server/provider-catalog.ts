export type ProviderMeta = {
  key: string;
  label: string;
  verifyHeaders?: Record<string, string>;
  cdnHeaders?: { pattern: RegExp; headers: Record<string, string> }[];
  disabled?: boolean;
};

// The SDK's declarations still describe verifyHeaders as a boolean, although
// both releases return a header object. Validate the catalog at this boundary.
export interface ProviderSdk {
  getSources(excludeDisabled: boolean): unknown[];
  getStream(key: string, id: string, season?: number | null, episode?: number | null): Promise<unknown>;
}

export type PlaybackProvider = ProviderMeta & {
  getStream(id: string, season?: number | null, episode?: number | null): Promise<unknown>;
};

export function createProviderCatalog(current: ProviderSdk, legacy: ProviderSdk): PlaybackProvider[] {
  const providers = new Map<string, PlaybackProvider>();
  // Prefer maintained adapters. Keep the older release only for removed keys,
  // including VidRock, Dulo, MovieNight and the older anime adapters.
  for (const sdk of [current, legacy]) {
    for (const raw of sdk.getSources(true)) {
      const provider = raw as ProviderMeta;
      if (!provider || typeof provider.key !== 'string' || typeof provider.label !== 'string' || provider.disabled || providers.has(provider.key)) continue;
      providers.set(provider.key, {
        ...provider,
        verifyHeaders: typeof provider.verifyHeaders === 'object' ? provider.verifyHeaders : undefined,
        getStream: (id, season, episode) => sdk.getStream(provider.key, id, season, episode),
      });
    }
  }
  return [...providers.values()];
}

export async function loadProviderCatalog(tmdbApiKey?: string): Promise<PlaybackProvider[]> {
  const [{ default: SDK }, { default: LegacySDK }] = await Promise.all([
    import('@vyla-entertainment/sdk'),
    import('vyla-sdk-legacy'),
  ]);
  return createProviderCatalog(new SDK({ tmdbApiKey }), new LegacySDK({ tmdbApiKey }));
}
