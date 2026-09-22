import { Module} from "@nestjs/common";
import { UsersModule } from "../users/users.module.js";
import { FollowsController } from "./follows.controller.js";
import { FollowsService } from "./follows.service.js";
import { FollowsRepositoty } from "./follows.repository.js";

@Module({
    imports:[UsersModule],
    controllers:[FollowsController],
    providers:[FollowsService,FollowsRepositoty],
    exports:[FollowsService],
})
export class FollowsModule{}