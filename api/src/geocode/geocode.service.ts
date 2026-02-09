import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeocodeException, GeocodeErrorCode } from './geocode.exception';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

/**
 * Service for geocoding addresses and reverse geocoding coordinates
 * Uses Geoapify API for geocoding operations
 */
@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.geoapify.com/v1/geocode';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEOAPIFY_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('GEOAPIFY_API_KEY not configured. Geocoding will fail.');
    }
  }

  /**
   * Geocode an address to geographic coordinates
   * @param address Full address string to geocode
   * @returns GeocodeResult with coordinates and address details, or null if geocoding fails
   * @throws GeocodeException if API key is missing or API returns error
   */
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!address || address.trim().length === 0) {
      this.logger.warn('Empty address provided for geocoding');
      return null;
    }

    if (!this.apiKey) {
      this.logger.error('Cannot geocode: GEOAPIFY_API_KEY not set');
      // Return null instead of throwing for backward compatibility
      // Services using this should handle null gracefully
      return null;
    }

    try {
      const url = `${this.baseUrl}/search?text=${encodeURIComponent(address)}&apiKey=${this.apiKey}&limit=1`;

      this.logger.debug(`Geocoding address: ${address}`);

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.error(
          `Geoapify API error: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        this.logger.warn(`No geocoding results found for address: ${address}`);
        return null;
      }

      const feature = data.features[0];
      const props = feature.properties;

      // Geoapify returns coordinates in properties.lat/lon
      const lat = props.lat;
      const lon = props.lon;

      if (lat === undefined || lon === undefined) {
        this.logger.error(
          `Invalid coordinates received from Geoapify API for address: ${address}`,
        );
        return null;
      }

      const result: GeocodeResult = {
        latitude: lat,
        longitude: lon,
        formattedAddress: props.formatted || address,
        city: props.city || props.town || props.village,
        country: props.country,
        postalCode: props.postcode,
      };

      this.logger.debug(
        `Geocoded successfully: ${result.formattedAddress} -> (${lat}, ${lon})`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Geocoding failed for address "${address}": ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Geocode a postal code to geographic coordinates
   * @param postalCode Postal code to geocode
   * @param country Country name (default: Germany)
   * @returns GeocodeResult or null
   */
  async geocodePostalCode(
    postalCode: string,
    country = 'Germany',
  ): Promise<GeocodeResult | null> {
    if (!postalCode || !/^\d{5}$/.test(postalCode)) {
      this.logger.warn(`Invalid postal code format: ${postalCode}`);
      return null;
    }
    return this.geocodeAddress(`${postalCode}, ${country}`);
  }

  /**
   * Reverse geocode coordinates to address information
   * @param latitude Latitude coordinate
   * @param longitude Longitude coordinate
   * @returns GeocodeResult with address details, or null if reverse geocoding fails
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<GeocodeResult | null> {
    if (!this.isValidCoordinate(latitude, longitude)) {
      this.logger.warn(`Invalid coordinates: (${latitude}, ${longitude})`);
      return null;
    }

    if (!this.apiKey) {
      this.logger.error('Cannot reverse geocode: GEOAPIFY_API_KEY not set');
      return null;
    }

    try {
      const url = `${this.baseUrl}/reverse?lat=${latitude}&lon=${longitude}&apiKey=${this.apiKey}&limit=1`;

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.error(
          `Geoapify API error: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        this.logger.warn(
          `No reverse geocoding results found for coordinates: (${latitude}, ${longitude})`,
        );
        return null;
      }

      const feature = data.features[0];
      const props = feature.properties;

      return {
        latitude,
        longitude,
        formattedAddress: props.formatted || `${latitude}, ${longitude}`,
        city: props.city || props.town || props.village,
        country: props.country,
        postalCode: props.postcode,
      };
    } catch (error) {
      this.logger.error(
        `Reverse geocoding failed for (${latitude}, ${longitude}): ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Validate geographic coordinates
   * @param latitude Latitude (-90 to 90)
   * @param longitude Longitude (-180 to 180)
   * @returns true if coordinates are valid
   */
  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }
}
