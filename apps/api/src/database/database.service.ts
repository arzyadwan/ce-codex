import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly client;
  readonly db: PostgresJsDatabase<typeof schema>;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL wajib dikonfigurasi.");
    this.client = postgres(databaseUrl, { prepare: false, max: 10 });
    this.db = drizzle(this.client, { schema });
  }

  async onModuleDestroy() {
    await this.client.end();
  }
}
