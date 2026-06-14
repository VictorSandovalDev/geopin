import { Controller, Get, Query } from "@nestjs/common";
import { LocationsService } from "./locations.service";

@Controller("locations")
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get()
  list(@Query("limit") limit?: string) {
    return this.locations.list(limit ? Number(limit) : undefined);
  }
}
