import { Body, Controller, Get, Post } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { ValidatePromotionDto } from './dto/validate-promotion.dto';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('me')
  findAvailable() {
    return this.promotionsService.findAvailable();
  }

  @Post('validate')
  validate(@Body() body: ValidatePromotionDto) {
    return this.promotionsService.validate(body);
  }
}
