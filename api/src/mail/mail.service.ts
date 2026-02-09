import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private templatesCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    this.registerPartials();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST', 'localhost');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 1025);
    const smtpSecure = this.configService.get<string>('SMTP_SECURE') === 'true';
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    const config: any = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth:
        smtpUser && smtpPassword
          ? {
              user: smtpUser,
              pass: smtpPassword,
            }
          : undefined,
    };

    // For port 587, use STARTTLS (secure: false but requireTLS: true)
    if (config.port === 587 && !config.secure) {
      config.requireTLS = true;
      config.tls = {
        // Do not fail on invalid certs in dev
        rejectUnauthorized: nodeEnv === 'production',
      };
    }

    this.transporter = nodemailer.createTransport(config);

    this.logger.log(
      `Mail service initialized with SMTP ${config.host}:${config.port}`,
    );
  }

  private registerPartials() {
    const templatesPath = join(process.cwd(), 'src', 'mail', 'templates');

    try {
      const files = readdirSync(templatesPath);
      const partials = files.filter(
        (file) => file.startsWith('_') && file.endsWith('.hbs'),
      );

      partials.forEach((partial) => {
        const partialName = partial.replace(/\.hbs$/, ''); // Keep the underscore
        const partialPath = join(templatesPath, partial);
        const partialContent = readFileSync(partialPath, 'utf-8');
        handlebars.registerPartial(partialName, partialContent);
        this.logger.log(`Registered partial: ${partialName}`);
      });
    } catch (error) {
      this.logger.warn('Could not load partials:', error);
    }
  }

  private getTemplate(templateName: string): HandlebarsTemplateDelegate {
    // Check cache first
    const cached = this.templatesCache.get(templateName);
    if (cached) {
      return cached;
    }

    // Load and compile template
    const templatePath = join(
      process.cwd(),
      'src',
      'mail',
      'templates',
      `${templateName}.hbs`,
    );

    try {
      const templateSource = readFileSync(templatePath, 'utf-8');
      const template = handlebars.compile(templateSource);
      this.templatesCache.set(templateName, template);
      return template;
    } catch (error) {
      this.logger.error(`Failed to load template ${templateName}:`, error);
      throw new Error(`E-Mail-Vorlage ${templateName} nicht gefunden`);
    }
  }

  async sendMail(options: EmailOptions): Promise<boolean> {
    try {
      const template = this.getTemplate(options.template);
      const html = template(options.context);

      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM'),
        to: options.to,
        subject: options.subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendVerificationEmail(
    email: string,
    nick: string,
    token: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    return this.sendMail({
      to: email,
      subject: 'Verifiziere deine E-Mail-Adresse',
      template: 'email-verification',
      context: {
        nick,
        verificationUrl,
        year: new Date().getFullYear(),
        brandName: this.configService.get<string>('BRAND_NAME', 'Eventos'),
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    nick: string,
    token: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    return this.sendMail({
      to: email,
      subject: 'Passwort zurücksetzen',
      template: 'password-reset',
      context: {
        nick,
        resetUrl,
        year: new Date().getFullYear(),
        brandName: this.configService.get<string>('BRAND_NAME', 'Eventos'),
      },
    });
  }

  async sendWelcomeEmail(email: string, nick: string): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: `Willkommen bei ${this.configService.get<string>('BRAND_NAME', 'Eventos')}!`,
      template: 'welcome',
      context: {
        nick,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login`,
        year: new Date().getFullYear(),
        brandName: this.configService.get<string>('BRAND_NAME', 'Eventos'),
      },
    });
  }
}
