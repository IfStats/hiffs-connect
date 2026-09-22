import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: "Hiffs Connect API",
      status: "online",
      version: "0.1.0",
    };
  }

  @Get("health")
  getHealth() {
    return {
      status: "ok",
      service: "hiffs-connect-api",
      timestamp: new Date().toISOString(),
    };
  }
}