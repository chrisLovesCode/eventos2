#!/usr/bin/env node
/**
 * Script to geocode all existing events that have an address but no coordinates
 * Run: npm run script:geocode-events
 */

import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

const prisma = new PrismaClient();

async function geocodeAddress(
  address: string,
  apiKey: string,
): Promise<GeocodeResult | null> {
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `❌ Geoapify API error: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.warn(`No results found for address: ${address}`);
      return null;
    }

    const feature = data.features[0];
    const props = feature.properties;

    const lat = props.lat;
    const lon = props.lon;

    return {
      latitude: lat,
      longitude: lon,
      formattedAddress: props.formatted || address,
      city: props.city || props.town || props.village,
      country: props.country,
      postalCode: props.postcode,
    };
  } catch (error) {
    console.error(`❌ Geocoding failed for "${address}":`, error.message);
    return null;
  }
}

async function geocodeExistingEvents() {
  console.log(' Starting geocoding of existing events...\n');

  // Get API key from environment
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    console.error(' GEOAPIFY_API_KEY not set in environment!');
    process.exit(1);
  }

  // Find all events with address but no coordinates
  const eventsToGeocode = await prisma.event.findMany({
    where: {
      eventAddress: {
        not: null,
      },
      latitude: null,
      longitude: null,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      eventAddress: true,
    },
  });

  console.log(`Found ${eventsToGeocode.length} events to geocode\n`);

  if (eventsToGeocode.length === 0) {
    console.log(' All events already have coordinates!');
    await prisma.$disconnect();
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const event of eventsToGeocode) {
    console.log(`\n🔍 Processing: ${event.name}`);
    console.log(`   Address: ${event.eventAddress}`);

    const result = await geocodeAddress(event.eventAddress!, apiKey);

    if (result) {
      await prisma.event.update({
        where: { id: event.id },
        data: {
          latitude: result.latitude,
          longitude: result.longitude,
        },
      });

      console.log(`   Success: ${result.latitude}, ${result.longitude}`);
      successCount++;
    } else {
      console.log(`   ❌ Failed to geocode`);
      failCount++;
    }

    // Rate limiting: Wait 200ms between requests (5 req/sec)
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   Successfully geocoded: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   Total processed: ${eventsToGeocode.length}`);
  console.log('='.repeat(60) + '\n');

  await prisma.$disconnect();
}

// pt
geocodeExistingEvents().catch((error) => {
  console.error(' Script failed:', error);
  process.exit(1);
});
