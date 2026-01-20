import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: { email: string; username?: string; mobile?: string; password?: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username || null,
        mobile: data.mobile || '',
        password: data.password || '',
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }
}
