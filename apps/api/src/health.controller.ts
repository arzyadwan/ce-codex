import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
@SkipThrottle({ burst: true, sustained: true })
@Controller("health")
export class HealthController {
  @Get() check() { return { status: "ok", service: "crypto-exist-api" }; }
}
