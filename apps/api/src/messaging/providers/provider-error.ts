export class MessagingProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly retryable: boolean,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'MessagingProviderError';
  }
}
