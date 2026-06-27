import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Support both username and admission number login for students
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { student: { admissionNumber: username } },
        ],
      },
      include: { student: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        student: user.student
          ? {
              id: user.student.id,
              admissionNumber: user.student.admissionNumber,
              firstName: user.student.firstName,
              lastName: user.student.lastName,
            }
          : null,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            faculty: true,
            school: true,
            department: true,
            programme: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, ...safeUser } = user;
    return { success: true, data: safeUser };
  }

  async createUser(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });
    if (existing) {
      throw new BadRequestException('Username already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        passwordHash,
        role: createUserDto.role,
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    return { success: true, data: safeUser };
  }
}
