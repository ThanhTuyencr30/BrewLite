import { createHmac } from 'node:crypto';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VnpayService } from './vnpay.service';

const CONFIG = {
  VNPAY_TMN_CODE: 'TESTCODE',
  VNPAY_HASH_SECRET: 'TESTSECRET',
  VNPAY_RETURN_URL: 'http://localhost:3001/payments/vnpay/return',
};

function createService(config: Record<string, string> = CONFIG) {
  return new VnpayService(new ConfigService(config));
}

function toQuery(url: string): Record<string, string> {
  return Object.fromEntries(new URL(url).searchParams.entries());
}

describe('VnpayService', () => {
  const input = {
    txnRef: '12def5a2-fc8d-4d1c-bef5-a41b3c35b498',
    amount: 119850,
    orderInfo: 'Thanh toan don hang CC-123456',
    ipAddress: '127.0.0.1',
    now: new Date('2026-10-27T05:00:00.000Z'),
  };

  it('builds a signed sandbox URL with amounts and Vietnam-time dates', () => {
    const url = new URL(createService().buildPaymentUrl(input));
    const params = toQuery(url.toString());

    expect(`${url.origin}${url.pathname}`).toBe(
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    );
    expect(params).toMatchObject({
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: 'TESTCODE',
      vnp_Amount: '11985000',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: input.txnRef,
      vnp_OrderInfo: input.orderInfo,
      vnp_ReturnUrl: CONFIG.VNPAY_RETURN_URL,
      vnp_CreateDate: '20261027120000',
      vnp_ExpireDate: '20261027121500',
    });
  });

  it('signs the sorted, encoded parameters with HMAC-SHA512', () => {
    const url = createService().buildPaymentUrl(input);
    const [, query] = url.split('?');
    const signData = query.replace(/&vnp_SecureHash=[0-9a-f]+$/, '');
    const expected = createHmac('sha512', 'TESTSECRET').update(signData).digest('hex');

    expect(query.endsWith(`&vnp_SecureHash=${expected}`)).toBe(true);
    expect(signData.split('&').map((pair) => pair.split('=')[0])).toEqual(
      [...signData.split('&').map((pair) => pair.split('=')[0])].sort(),
    );
    // Khoảng trắng được mã hóa thành dấu + như VNPay yêu cầu.
    expect(signData).toContain('vnp_OrderInfo=Thanh+toan+don+hang+CC-123456');
  });

  it('accepts a callback carrying a valid signature and rejects tampering', () => {
    const service = createService();
    const query = toQuery(service.buildPaymentUrl(input));

    expect(service.verify(query)).toMatchObject({
      isValidSignature: true,
      txnRef: input.txnRef,
      amount: 119850,
    });
    expect(service.verify({ ...query, vnp_Amount: '100' }).isValidSignature).toBe(false);
    expect(service.verify({ ...query, vnp_SecureHash: 'abc' }).isValidSignature).toBe(false);
    expect(
      createService({ ...CONFIG, VNPAY_HASH_SECRET: 'OTHER' }).verify(query).isValidSignature,
    ).toBe(false);
  });

  it('reports success only when both response and transaction status are 00', () => {
    const service = createService();
    const signed = (extra: Record<string, string>) => {
      const params: Record<string, string> = { vnp_TxnRef: 'ref', vnp_Amount: '1000000', ...extra };
      const signData = Object.keys(params)
        .sort()
        .map((key) => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`)
        .join('&');
      return {
        ...params,
        vnp_SecureHash: createHmac('sha512', 'TESTSECRET').update(signData).digest('hex'),
      };
    };

    expect(service.verify(signed({ vnp_ResponseCode: '00', vnp_TransactionStatus: '00' }))).toMatchObject({
      isValidSignature: true,
      isSuccess: true,
      amount: 10000,
    });
    expect(service.verify(signed({ vnp_ResponseCode: '24', vnp_TransactionStatus: '02' })).isSuccess).toBe(false);
    expect(service.verify(signed({ vnp_ResponseCode: '00', vnp_TransactionStatus: '01' })).isSuccess).toBe(false);
  });

  it('refuses to run without credentials', () => {
    expect(() => createService({}).buildPaymentUrl(input)).toThrow(ServiceUnavailableException);
    expect(() => createService({}).verify({})).toThrow(ServiceUnavailableException);
  });
});
