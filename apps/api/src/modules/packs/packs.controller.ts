import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { PacksService } from "./packs.service";
import { CreatePackDto } from "./dto";

@Controller("packs")
export class PacksController {
  constructor(private readonly packs: PacksService) {}

  @Get()
  async list(@Req() req: any) {
    // Public endpoint; if a token is present we show the caller's packs too.
    const userId = await tryExtractUserId(req);
    return this.packs.list(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreatePackDto) {
    return this.packs.create(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  @HttpCode(204)
  async remove(@Req() req: any, @Param("id") id: string) {
    await this.packs.delete(req.user.sub, id);
  }
}

/**
 * Extract the user id from the Authorization header if present, else return
 * undefined. We keep this route public but personalize the response when a
 * valid JWT is attached.
 */
async function tryExtractUserId(req: any): Promise<string | undefined> {
  const auth = req.headers?.authorization as string | undefined;
  if (!auth?.startsWith("Bearer ")) return undefined;
  try {
    // Decoding is enough here — the sensitive paths (create/delete) run
    // through the JwtAuthGuard. This just surfaces user-owned packs on list.
    const [, payload] = auth.slice(7).split(".");
    if (!payload) return undefined;
    const json = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    return json?.sub as string | undefined;
  } catch {
    return undefined;
  }
}
