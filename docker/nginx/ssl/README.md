# SSL Certificates Directory

Place your SSL certificates here for HTTPS support.

## Using Let's Encrypt (Recommended)

1. Install certbot on your server:
   ```bash
   apt-get install certbot
   ```

2. Obtain certificate:
   ```bash
   certbot certonly --standalone -d your-domain.com
   ```

3. Copy certificates:
   ```bash
   cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./docker/nginx/ssl/
   cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./docker/nginx/ssl/
   ```

4. Update nginx.conf to use the certificates

## Using Custom Certificates

Place your certificate files here:
- `fullchain.pem` - Full certificate chain
- `privkey.pem` - Private key

## Auto-Renewal

Add to crontab for auto-renewal:
```bash
0 0 * * * certbot renew --quiet && docker-compose -f /opt/eventos2/docker-compose.prod.yml restart nginx
```
