import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { UsersService } from "./users.service";

class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^av1:\d+\.\d+\.\d+\.\d+\.\d+$/, {
    message: "avatarSeed must be a valid avatar config",
  })
  avatarSeed?: string;
}

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@Req() req: any) {
    return this.users.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me")
  async updateMe(@Req() req: any, @Body() body: UpdateMeDto) {
    return this.users.updateProfile(req.user.sub, body);
  }

  @Get("leaderboard")
  async leaderboard(
    @Query("country") country?: string,
    @Query("limit") limit?: string,
  ) {
    return this.users.leaderboard({
      country,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(":id")
  async profile(@Param("id") id: string) {
    return this.users.getProfile(id);
  }
}
