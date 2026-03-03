import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviertService } from './reviert.service';

@Controller('reviert')
@UseGuards(JwtAuthGuard)

export class reviertController {
    constructor(private readonly reviertService: ReviertService) { }

    @Post()
    async getReviert(
        @Req() req,
        @Body() body: {
            serviceName: string;
            filters?: any;
            productIds?: string[];
        },
    ) {
        const { shopId } = req.user;

        const { serviceName, filters, productIds } = body;

        return this.reviertService.reviertGet(
            shopId,
            serviceName,
            filters,
            productIds,
        );
    }

    @Post('save')
async revertData(
  @Req() req,
  @Body() body: {
    serviceName: string;
    filters?: any;
    productIds?: string[];
  },
) {
  const { shopId } = req.user;
  const { serviceName, filters, productIds } = body;
    
  return this.reviertService.revertSave(
    shopId,
    serviceName,
    filters,
    productIds,
  );
}

}