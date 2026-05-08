declare module 'midtrans-client' {
  export class Snap {
    constructor(options: {
      isProduction: boolean;
      serverKey: string | undefined;
      clientKey: string | undefined;
    });
    createTransaction(parameter: Record<string, unknown>): Promise<Record<string, unknown>>;
  }
  export class CoreApi {
    constructor(options: {
      isProduction: boolean;
      serverKey: string | undefined;
      clientKey: string | undefined;
    });
    charge(parameter: Record<string, unknown>): Promise<Record<string, unknown>>;
    transaction: {
      notification(notificationJson: Record<string, unknown> | string): Promise<Record<string, unknown>>;
    };
  }
}
