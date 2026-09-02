export type DomainErrorType = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR' | 'UNAUTHORIZED' | 'TOO_MANY_REQUESTS';

export interface DomainResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: DomainErrorType;
  /**
   * Additional metadata (e.g. out_of_stock_item id)
   */
  meta?: Record<string, any>;
}

/**
 * Helper to construct a successful DomainResult
 */
export function DomainSuccess<T>(data?: T, meta?: Record<string, any>): DomainResult<T> {
  return { success: true, data, meta };
}

/**
 * Helper to construct a failed DomainResult
 */
export function DomainFailure<T = void>(error: string, errorType: DomainErrorType = 'INTERNAL_ERROR', meta?: Record<string, any>): DomainResult<T> {
  return { success: false, error, errorType, meta };
}
