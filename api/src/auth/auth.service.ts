import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, AuthResponseDto } from './dto/auth.dto';
import {
  RegisterDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/register.dto';
import { AUTH_CONSTANTS } from './constants/auth.constants';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

type UserRole = 'ADMIN' | 'MODERATOR' | 'USER';

type DbUser = {
  id: string;
  email: string;
  nick: string;
  role: UserRole;
  password: string | null;
  isActive: boolean;
  emailVerified: boolean;
  tokenVersion: number;
  provider: 'LOCAL' | 'GOOGLE' | 'FACEBOOK' | 'APPLE';
  providerId: string | null;
};

type PrismaUserDelegate = {
  findUnique: (args: { where: { email: string } }) => Promise<DbUser | null>;
};

/**
 * Service handling authentication operations
 * Manages user login, JWT token generation, and password hashing
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  private getUserDelegate(): PrismaUserDelegate {
    return (this.prisma as unknown as { user: PrismaUserDelegate }).user;
  }

  private buildAuthResponse(
    user: {
      id: string;
      email: string;
      nick: string;
      role: UserRole;
      tokenVersion: number;
    },
    refreshToken?: string,
  ): AuthResponseDto {
    const payload: {
      sub: string;
      email: string;
      role: UserRole;
      tokenVersion: number;
    } = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nick: user.nick,
        role: user.role,
      },
    };
  }

  private getRefreshTokenSecret(): string {
    return (
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      ''
    );
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiresInToMs(expiresIn: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiresIn.trim());
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }
    const value = Number(match[1]);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  private async issueRefreshToken(
    user: { id: string; tokenVersion: number },
  ): Promise<{ token: string; tokenHash: string; expiresAt: Date }> {
    const tokenId = randomBytes(32).toString('hex');
    const expiresIn = AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRATION;
    const expiresAt = new Date(Date.now() + this.parseExpiresInToMs(expiresIn));
    const secret = this.getRefreshTokenSecret();

    const token = this.jwtService.sign(
      {
        sub: user.id,
        tokenVersion: user.tokenVersion ?? 0,
        jti: tokenId,
        type: 'refresh',
      },
      {
        secret,
        expiresIn,
      },
    );

    const tokenHash = this.hashToken(token);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    return { token, tokenHash, expiresAt };
  }

  /**
   * Validates user credentials
   * @param email User email address
   * @param password User password (plain text)
   * @returns User object without password if valid
   * @throws UnauthorizedException if credentials are invalid or user is inactive
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<{
    id: string;
    email: string;
    nick: string;
    role: UserRole;
    isActive: boolean;
    tokenVersion: number;
  }> {
    const user = await this.getUserDelegate().findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Ungültige Anmeldedaten');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Benutzer ist deaktiviert');
    }

    if (!user.emailVerified && user.provider === 'LOCAL') {
      throw new UnauthorizedException(
        'E-Mail nicht verifiziert. Bitte überprüfen Sie Ihren Posteingang.',
      );
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'Dieser Account verwendet eine externe Anmeldung. Bitte kontaktieren Sie den Support.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Ungültige Anmeldedaten');
    }

    return {
      id: user.id,
      email: user.email,
      nick: user.nick,
      role: user.role,
      isActive: user.isActive,
      tokenVersion: user.tokenVersion ?? 0,
    };
  }

  /**
   * Authenticates user and generates JWT token
   * @param loginDto Login credentials (email and password)
   * @returns JWT access token and user information
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const refreshToken = await this.issueRefreshToken(user);
    return this.buildAuthResponse(user, refreshToken.token);
  }

  /**
   * Validates JWT token
   * @param token JWT token to validate
   * @returns Decoded token payload if valid
   * @throws UnauthorizedException if token is invalid or expired
   */
  validateToken(token: string): unknown {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Ungültiges Token');
    }
  }

  /**
   * Hashes password using bcrypt
   * @param password Plain text password to hash
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, AUTH_CONSTANTS.BCRYPT_ROUNDS);
  }

  /**
   * Generates a secure random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Registers a new user with email verification
   */
  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-Mail bereits registriert');
    }

    // Check if nick already exists
    const existingNick = await this.prisma.user.findUnique({
      where: { nick: registerDto.nick },
    });

    if (existingNick) {
      throw new ConflictException('Benutzername bereits vergeben');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Create user (not verified)
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        nick: registerDto.nick,
        password: hashedPassword,
        provider: 'LOCAL',
        emailVerified: false,
      },
    });

    // Create verification token
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours validity

    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'email_verification',
        expiresAt,
      },
    });

    // Send verification email
    await this.mailService.sendVerificationEmail(user.email, user.nick, token);

    return {
      message:
        'Registrierung erfolgreich. Bitte überprüfen Sie Ihre E-Mails zur Bestätigung.',
    };
  }

  /**
   * Verifies user email with token
   */
  async verifyEmail(verifyDto: VerifyEmailDto): Promise<AuthResponseDto> {
    // Find verification token
    const verification = await this.prisma.verificationToken.findUnique({
      where: { token: verifyDto.token },
      include: { user: true },
    });

    if (!verification) {
      throw new BadRequestException(
        'Ungültiges oder abgelaufenes Verifizierungstoken',
      );
    }

    // Check if token expired
    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('Verifizierungstoken ist abgelaufen');
    }

    // Check if token type is correct
    if (verification.type !== 'email_verification') {
      throw new BadRequestException('Ungültiger Token-Typ');
    }

    // Update user as verified
    const user = await this.prisma.user.update({
      where: { id: verification.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Delete verification token
    await this.prisma.verificationToken.delete({
      where: { id: verification.id },
    });

    // Send welcome email
    await this.mailService.sendWelcomeEmail(user.email, user.nick);

    // Generate JWT token for automatic login
    const refreshToken = await this.issueRefreshToken({
      id: user.id,
      tokenVersion: user.tokenVersion ?? 0,
    });

    return this.buildAuthResponse(
      {
        id: user.id,
        email: user.email,
        nick: user.nick,
        role: user.role,
        tokenVersion: user.tokenVersion ?? 0,
      },
      refreshToken.token,
    );
  }

  /**
   * Resends verification email
   */
  async resendVerification(
    resendDto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: resendDto.email },
    });

    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }

    if (user.emailVerified) {
      throw new BadRequestException('E-Mail bereits verifiziert');
    }

    if (user.provider !== 'LOCAL') {
      throw new BadRequestException(
        'E-Mail-Verifizierung ist nur für lokale Accounts verfügbar',
      );
    }

    // Delete old verification tokens
    await this.prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: 'email_verification',
      },
    });

    // Create new verification token
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'email_verification',
        expiresAt,
      },
    });

    // Send verification email
    await this.mailService.sendVerificationEmail(user.email, user.nick, token);

    return {
      message:
        'Verifizierungs-E-Mail gesendet. Bitte überprüfen Sie Ihren Posteingang.',
    };
  }

  /**
   * Initiates password reset process
   */
  async forgotPassword(
    forgotDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotDto.email },
    });

    // Always return success to prevent email enumeration
    if (!user || user.provider !== 'LOCAL') {
      return {
        message:
          'Falls die E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.',
      };
    }

    // Delete old reset tokens
    await this.prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: 'password_reset',
      },
    });

    // Create reset token
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour validity

    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'password_reset',
        expiresAt,
      },
    });

    // Send reset email
    await this.mailService.sendPasswordResetEmail(user.email, user.nick, token);

    return {
      message:
        'Falls die E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.',
    };
  }

  /**
   * Resets user password with token
   */
  async resetPassword(
    resetDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    // Find reset token
    const verification = await this.prisma.verificationToken.findUnique({
      where: { token: resetDto.token },
      include: { user: true },
    });

    if (!verification) {
      throw new BadRequestException('Ungültiges oder abgelaufenes Reset-Token');
    }

    // Check if token expired
    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('Reset-Token ist abgelaufen');
    }

    // Check if token type is correct
    if (verification.type !== 'password_reset') {
      throw new BadRequestException('Ungültiger Token-Typ');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(resetDto.newPassword);

    // Update user password
    await this.prisma.user.update({
      where: { id: verification.userId },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 },
      },
    });

    await this.prisma.refreshToken.deleteMany({
      where: { userId: verification.userId },
    });

    // Delete reset token
    await this.prisma.verificationToken.delete({
      where: { id: verification.id },
    });

    return {
      message:
        'Password reset successful. You can now login with your new password.',
    };
  }

  /**
   * Refreshes access token for an authenticated user (sliding session)
   */
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const payload = this.validateRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);

    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existingToken) {
      throw new UnauthorizedException('Refresh-Token ungültig');
    }

    if (existingToken.userId !== payload.sub) {
      await this.prisma.refreshToken.deleteMany({
        where: { tokenHash },
      });
      throw new UnauthorizedException('Refresh-Token ungültig');
    }

    if (existingToken.revokedAt) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId: existingToken.userId },
      });
      throw new UnauthorizedException('Refresh-Token wurde widerrufen');
    }

    if (existingToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.deleteMany({
        where: { tokenHash },
      });
      throw new UnauthorizedException('Refresh-Token ist abgelaufen');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Benutzer nicht gefunden oder deaktiviert',
      );
    }

    if (!user.emailVerified && user.provider === 'LOCAL') {
      throw new UnauthorizedException('E-Mail nicht verifiziert');
    }

    if (
      typeof payload.tokenVersion === 'number' &&
      user.tokenVersion !== payload.tokenVersion
    ) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });
      throw new UnauthorizedException('Refresh-Token ist ungültig');
    }

    const newRefreshToken = await this.issueRefreshToken({
      id: user.id,
      tokenVersion: user.tokenVersion ?? 0,
    });

    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: {
        revokedAt: new Date(),
        replacedByTokenHash: newRefreshToken.tokenHash,
      },
    });

    return this.buildAuthResponse(
      {
        id: user.id,
        email: user.email,
        nick: user.nick,
        role: user.role,
        tokenVersion: user.tokenVersion ?? 0,
      },
      newRefreshToken.token,
    );
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });
  }

  private validateRefreshToken(token: string): {
    sub: string;
    tokenVersion?: number;
    type?: string;
  } {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.getRefreshTokenSecret(),
      });
      if (payload?.type !== 'refresh') {
        throw new UnauthorizedException('Refresh-Token ungültig');
      }
      return payload as { sub: string; tokenVersion?: number; type?: string };
    } catch {
      throw new UnauthorizedException('Refresh-Token ungültig');
    }
  }

}
