import { Body, Controller, Get, Post, Delete, Req, UseGuards } from "@nestjs/common";
import { TagsBuilderService } from "./tags-builder.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("tags-builder")
@UseGuards(JwtAuthGuard)
export class TagsBuilderController {

constructor(
private readonly service: TagsBuilderService
){}

@Post("analyze-tags")
analyze(@Req() req,@Body() dto){
    const { shopId } = req.user;
    return this.service.analyzeProductTags(shopId,dto);
}

@Post("add-tags")
addTags(@Req() req,@Body() dto){
    const { shopId } = req.user;
    return this.service.addTags(shopId,dto);
}

@Delete("remove-tags")
removeTags(@Req() req,@Body() dto){
    const { shopId } = req.user;
    return this.service.removeTags(shopId,dto);
}

}