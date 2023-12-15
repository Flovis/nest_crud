import { ForbiddenException, Injectable } from '@nestjs/common';
import { User, Bookmark } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async signup(dto: AuthDto) {
    //generate the password
    const hash = await argon.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });
      delete user.hash;

      //return the save user
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email exite déjà');
        }
      }
      throw error;
    }

    //save the new user
  }

  async signin(dto: AuthDto) {
    //find the user
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    //is user does not existe
    if (!user) throw new ForbiddenException('Email ou mot de passe incorrect');
    ('');
    //compare password
    const pswMatch = await argon.verify(user.hash, dto.password);

    //if pssword incorrect
    if (!pswMatch)
      throw new ForbiddenException('Email ou mot de passe incorrect');

    delete user.hash;

    return user;
  }
}
