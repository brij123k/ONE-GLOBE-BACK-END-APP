import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { CollectionBuilderService } from "./collection-builder.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("collection-builder")
@UseGuards(JwtAuthGuard)
export class CollectionBuilderController {

constructor(
private readonly service: CollectionBuilderService
){}

@Get("products")
getProducts(@Req() req){
    const { shopId } = req.user;
return this.service.getProducts(shopId);
}

@Get("collections")
getCollections(@Req() req){
    const { shopId } = req.user;
return this.service.getCollections(shopId);
}

@Post("product-collections")
getProductCollections(@Req() req,@Body() body){
    const { shopId } = req.user;
return this.service.getProductCollections(shopId, body.productIds);
}

@Post("analyze-category")
analyze(@Req() req,@Body() dto){
    const { shopId } = req.user;
return this.service.analyzeProductCategory(shopId,dto);
}

@Post("create-collection")
create(@Req() req,@Body() dto){
    const { shopId } = req.user;
return this.service.createCollection(shopId,dto);
}

@Post("add-products")
addProducts(@Req() req,@Body() dto){
    const { shopId } = req.user;
return this.service.addProductsToCollection(shopId,dto);
}

@Delete("collection")
async deleteCollection(
@Req() req,@Body() dto
) {
    const { shopId } = req.user;
  return this.service.deleteCollection(shopId, dto.collectionId);
}

}