import { ContentfulStatusCode } from 'hono/utils/http-status';

export class HttpError extends Error {
  constructor(
    message: string,
    public status: ContentfulStatusCode,
  ) {
    super(message);
  }
}
