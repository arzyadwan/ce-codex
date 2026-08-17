import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { EditorialController } from "./editorial.controller.js";
import { EditorialService } from "./editorial.service.js";
import { TaxonomyController } from "./taxonomy.controller.js";

@Module({ imports: [AuthModule], controllers: [EditorialController, TaxonomyController], providers: [EditorialService] })
export class EditorialModule {}
