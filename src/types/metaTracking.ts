export interface MetaTrackingStatus {
  pixelId: string | null;
  capiTokenExists: boolean;
  pageId: string | null;
  adAccountId: string | null;
  catalog: {
    feedUrl: string;
    totalProductsSynced: number;
    lastSynced: string;
  };
  supportedEvents: {
    name: string;
    clientSide: boolean;
    serverSide: boolean;
  }[];
}
