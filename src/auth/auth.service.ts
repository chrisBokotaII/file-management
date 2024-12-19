import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDTO } from './dto/login-auth.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EncryptActions } from './encrypt/encrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}
  async create(createAuthDto: CreateAuthDto) {
    createAuthDto.password = await EncryptActions.hashPassword(
      createAuthDto.password,
    );
    const user = await this.userService.create(createAuthDto);
    const token = await this.jwtService.signAsync({ sub: user.id });

    return {
      user,
      token,
    };
  }

  async login(loginDTO: LoginDTO) {
    const user = await this.userService.findOne(loginDTO.email);
    const comparePassword = await EncryptActions.comparePassword(
      loginDTO.password,
      user.password,
    );
    if (!comparePassword)
      throw new UnauthorizedException('Invalid credentials');
    const token = await this.jwtService.signAsync({ sub: user._id });
    return {
      user,
      token,
    };
  }
}
