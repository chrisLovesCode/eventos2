import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Role, User, Prisma } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private mailService: MailService,
  ) {}

  /**
   * Get current user profile
   */
  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }

    return this.mapToResponseDto(user);
  }

  /**
   * Get user by ID (Admin/Moderator only)
   */
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Benutzer mit ID ${id} nicht gefunden`);
    }

    return this.mapToResponseDto(user);
  }

  /**
   * Update user profile
   * Users can update their own profile (except role)
   * Admins can update anyone and change roles
   * Moderators can update users but not change roles
   */
  async update(
    targetUserId: string,
    updateDto: UpdateUserDto,
    currentUser: { sub: string; role: Role },
  ): Promise<UserResponseDto> {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException(
        `Benutzer mit ID ${targetUserId} nicht gefunden`,
      );
    }

    // Only admins can change roles
    if (updateDto.role && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Nur Admins können Benutzerrollen ändern');
    }

    const isEmailChanging =
      updateDto.email && updateDto.email !== targetUser.email;

    // Check email uniqueness if changed
    if (isEmailChanging) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateDto.email },
      });

      if (existingUser) {
        throw new ConflictException('E-Mail wird bereits verwendet');
      }
    }

    // Hash password if provided

    const data: Prisma.UserUpdateInput = {};

    if (updateDto.nick !== undefined) {
      data.nick = updateDto.nick;
    }
    let shouldBumpTokenVersion = false;

    if (updateDto.email !== undefined) {
      data.email = updateDto.email;
      if (isEmailChanging) {
        data.emailVerified = false;
        data.emailVerifiedAt = null;
        shouldBumpTokenVersion = true;
      }
    }
    if (updateDto.role !== undefined) {
      data.role = updateDto.role;
    }
    if (updateDto.password) {
      data.password = await this.authService.hashPassword(updateDto.password);
      shouldBumpTokenVersion = true;
    }

    if (shouldBumpTokenVersion) {
      data.tokenVersion = { increment: 1 };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data,
    });

    if (shouldBumpTokenVersion) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId: updatedUser.id },
      });
    }

    if (isEmailChanging) {
      // Delete old verification tokens and create a new one
      await this.prisma.verificationToken.deleteMany({
        where: {
          userId: updatedUser.id,
          type: 'email_verification',
        },
      });

      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await this.prisma.verificationToken.create({
        data: {
          userId: updatedUser.id,
          token,
          type: 'email_verification',
          expiresAt,
        },
      });

      await this.mailService.sendVerificationEmail(
        updatedUser.email,
        updatedUser.nick,
        token,
      );
    }

    return this.mapToResponseDto(updatedUser);
  }

  /**
   * Delete user account
   * Users can delete their own account
   * Admins can delete any user
   * Moderators can delete users but not admins (checked by guard)
   */
  async remove(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Benutzer mit ID ${userId} nicht gefunden`);
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Map Prisma User to UserResponseDto (exclude password)
   */
  private mapToResponseDto(user: User): UserResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}
