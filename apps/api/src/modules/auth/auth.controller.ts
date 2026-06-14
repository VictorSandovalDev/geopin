import { Body, Controller, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";
import { JwtAuthGuard } from "./jwt.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post("guest")
  @HttpCode(200)
  guest(@Body() dto: { username?: string }) {
    return this.auth.guest(dto?.username);
  }

  @UseGuards(JwtAuthGuard)
  @Post("me")
  @HttpCode(200)
  me(@Req() req: any) {
    return { user: req.user };
  }
}
