import { PrismaClient } from '@prisma/client';
import { readdir } from 'fs/promises';
import { join } from 'path';
import * as fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:3000';

async function getAdminToken(): Promise<string> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL und ADMIN_PASSWORD müssen in .env.local gesetzt sein');
  }

  console.log(' Login als Admin...');
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login fehlgeschlagen: ${response.status}`);
  }

  const data: any = await response.json();
  console.log(' Login erfolgreich\n');
  return data.access_token;
}

async function uploadBanners() {
  let token: string;
  
  try {
    // Admin Token holen
    token = await getAdminToken();
    
    console.log(' Starte Banner-Upload...\n');

    // 1. Load all events
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'asc' },
    });

    if (events.length === 0) {
      console.log(' Keine Events gefunden!');
      return;
    }

    console.log(`📊 ${events.length} Events gefunden\n`);

    // 2. Load all images from dummyContent
    const dummyContentPath = '/app/dummyContent';
    const imageFiles = await readdir(dummyContentPath);
    const jpgFiles = imageFiles.filter(file => 
      file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')
    );

    console.log(`${jpgFiles.length} Bilder gefunden\n`);

    if (jpgFiles.length < events.length) {
      console.log('Warnung: Weniger Bilder als Events vorhanden!');
    }

    // 3. For each event: upload image and patch event
    let successCount = 0;
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const imageFile = jpgFiles[i]; // Jedes Event bekommt ein eigenes Bild

      if (!imageFile) {
        console.log(`Event "${event.name}" - Kein Bild mehr verfügbar\n`);
        continue;
      }

      console.log(`\n📤 [${i + 1}/${events.length}] Event: "${event.name}"`);
      console.log(`   Bild: ${imageFile}`);

      try {
        // Schritt 1: Bild hochladen
        const imagePath = join(dummyContentPath, imageFile);
        const imageBuffer = fs.createReadStream(imagePath);

        const formData = new FormData();
        formData.append('file', imageBuffer, {
          filename: imageFile,
          contentType: 'image/jpeg',
        });

        console.log(`   Uploading image...`);
        const uploadResponse = await fetch(`${API_URL}/files/event-banner`, {
          method: 'POST',
          body: formData,
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(`   ❌ Upload fehlgeschlagen: ${uploadResponse.status}`);
          console.error(`   📄 Response: ${errorText}`);
          throw new Error(`Upload Error ${uploadResponse.status}: ${errorText}`);
        }

        const uploadResult: any = await uploadResponse.json();
        const bannerPath = uploadResult.path;

        console.log(`   Upload successful: ${bannerPath}`);
        
        // Wait 2 seconds before patch
        console.log(`   Waiting 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Update event with banner via PATCH
        console.log(`   Patching event...`);
        const patchResponse = await fetch(`${API_URL}/events/${event.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            banner: bannerPath,
          }),
        });

        if (!patchResponse.ok) {
          const errorText = await patchResponse.text();
          console.error(`   ❌ Event-Update fehlgeschlagen: ${patchResponse.status}`);
          console.error(`   📄 Response: ${errorText}`);
          throw new Error(`Patch Error ${patchResponse.status}: ${errorText}`);
        }

        console.log(`   Event updated`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ FEHLER: ${error.message}`);
        console.error(`   📋 Details:`, error);
        
        // Bei Rate Limiting Extra lange warten
        if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
          console.log(`   Rate limit reached - waiting 15 seconds...\n`);
          await new Promise(resolve => setTimeout(resolve, 15000));
        } else {
          console.log(`   Waiting 3 seconds...\n`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Pause between each event (also on success)
      if (i < events.length - 1) {
        console.log(`   🔄 Nächstes Event in 5 Sekunden...\n`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log(`\nDone! ${successCount} of ${events.length} events updated with banners.`);

  } catch (error) {
    console.error(' Fehler beim Banner-Upload:', error);
  } finally {
    await prisma.$disconnect();
  }
}

uploadBanners();
