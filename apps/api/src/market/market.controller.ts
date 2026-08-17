import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { MarketService } from "./market.service.js";

@ApiTags("market")
@Controller("market")
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Get("prices")
  @Throttle({ burst: { limit: 5, ttl: 1_000 }, sustained: { limit: 30, ttl: 60_000 } })
  prices() { return this.market.prices(); }
}
