import { HttpException, HttpStatus } from '@nestjs/common';

export enum GeocodeErrorCode {
  API_KEY_MISSING = 'GEOCODE_API_KEY_MISSING',
  API_ERROR = 'GEOCODE_API_ERROR',
  NO_RESULTS = 'GEOCODE_NO_RESULTS',
  NETWORK_ERROR = 'GEOCODE_NETWORK_ERROR',
  INVALID_INPUT = 'GEOCODE_INVALID_INPUT',
}

export class GeocodeException extends HttpException {
  constructor(
    public readonly errorCode: GeocodeErrorCode,
    public readonly address: string,
    public readonly originalError?: Error,
  ) {
    const message = GeocodeException.getMessageForCode(errorCode, address);
    super(
      {
        statusCode: HttpStatus.BAD_GATEWAY,
        message,
        errorCode,
        address,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }

  private static getMessageForCode(
    code: GeocodeErrorCode,
    address: string,
  ): string {
    switch (code) {
      case GeocodeErrorCode.API_KEY_MISSING:
        return 'Geocoding service not configured. API key is missing.';
      case GeocodeErrorCode.API_ERROR:
        return `Geocoding API returned an error for address: ${address}`;
      case GeocodeErrorCode.NO_RESULTS:
        return `No geocoding results found for address: ${address}`;
      case GeocodeErrorCode.NETWORK_ERROR:
        return `Network error while geocoding address: ${address}`;
      case GeocodeErrorCode.INVALID_INPUT:
        return `Invalid input provided for geocoding: ${address}`;
      default:
        return `Geocoding failed for address: ${address}`;
    }
  }
}
