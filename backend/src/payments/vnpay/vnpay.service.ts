import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const VNPAY_DEFAULT_URL =
  'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
export const VNPAY_EXPIRY_MS = 15 * 60 * 1000;

export type VnpayParams = Record<string, string>;

export interface VnpayPaymentInput {
  txnRef: string;
  amount: number;
  orderInfo: string;
  ipAddress: string;
  now?: Date;
}

export interface VnpayResult {
  isValidSignature: boolean;
  txnRef: string;
  amount: number;
  isSuccess: boolean;
  responseCode: string;
}

// Giờ Việt Nam (UTC+7) theo định dạng yyyyMMddHHmmss mà VNPay yêu cầu.
function formatVnpayDate(date: Date): string {
  const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return vietnamTime.toISOString().replace(/\D/g, '').slice(0, 14);
}

function encodeValue(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '+');
}

function toSignData(params: VnpayParams): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeValue(params[key])}`)
    .join('&');
}

@Injectable()
export class VnpayService {
  constructor(private readonly config: ConfigService) {}

  buildPaymentUrl(input: VnpayPaymentInput): string {
    const tmnCode = this.requireConfig('VNPAY_TMN_CODE');
    const secret = this.requireConfig('VNPAY_HASH_SECRET');
    const now = input.now ?? new Date();

    const params: VnpayParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      // VNPay tính tiền theo đơn vị nhỏ nhất, nhân 100.
      vnp_Amount: String(input.amount * 100),
      vnp_CreateDate: formatVnpayDate(now),
      vnp_ExpireDate: formatVnpayDate(new Date(now.getTime() + VNPAY_EXPIRY_MS)),
      vnp_CurrCode: 'VND',
      vnp_IpAddr: input.ipAddress,
      vnp_Locale: 'vn',
      vnp_OrderInfo: input.orderInfo,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: this.requireConfig('VNPAY_RETURN_URL'),
      vnp_TxnRef: input.txnRef,
    };

    const signData = toSignData(params);
    const secureHash = this.sign(signData, secret);
    const baseUrl = this.config.get<string>('VNPAY_URL') || VNPAY_DEFAULT_URL;

    return `${baseUrl}?${signData}&vnp_SecureHash=${secureHash}`;
  }

  // Kiểm tra dữ liệu VNPay gửi về (qua Return URL hoặc IPN).
  verify(query: Record<string, unknown>): VnpayResult {
    const secret = this.requireConfig('VNPAY_HASH_SECRET');
    const received = typeof query.vnp_SecureHash === 'string' ? query.vnp_SecureHash : '';

    const params: VnpayParams = {};
    for (const [key, value] of Object.entries(query)) {
      if (
        key.startsWith('vnp_') &&
        key !== 'vnp_SecureHash' &&
        key !== 'vnp_SecureHashType' &&
        typeof value === 'string'
      ) {
        params[key] = value;
      }
    }

    const expected = this.sign(toSignData(params), secret);
    const responseCode = params.vnp_ResponseCode ?? '';

    return {
      isValidSignature: this.safeEqual(expected, received.toLowerCase()),
      txnRef: params.vnp_TxnRef ?? '',
      // Số tiền VNPay gửi về đã nhân 100.
      amount: Math.round(Number(params.vnp_Amount ?? 0) / 100),
      isSuccess: responseCode === '00' && params.vnp_TransactionStatus === '00',
      responseCode,
    };
  }

  private sign(signData: string, secret: string): string {
    return createHmac('sha512', secret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');
  }

  private safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  }

  private requireConfig(name: string): string {
    const value = this.config.get<string>(name);
    if (!value) {
      throw new ServiceUnavailableException('Cổng thanh toán VNPay chưa được cấu hình.');
    }
    return value;
  }
}
