import { Body, Controller, Post } from '@nestjs/common';
import { CartService } from './cart.service';
import { ValidateCartDto } from './dto/validate-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('validate')
  validate(@Body() body: ValidateCartDto) {
    return this.cartService.validateCart(body);
  }
}
