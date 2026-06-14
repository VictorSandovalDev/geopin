import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@Req() req: any) {
    return this.users.getProfile(req.user.sub);
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
