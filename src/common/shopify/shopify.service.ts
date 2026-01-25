import axios from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ShopifyService {
  async shopifyRequest(
    shopDomain: string,
    accessToken: string,
    query: string,
    variables?: any,
  ) {
    const url = `https://${shopDomain}/admin/api/2026-01/graphql.json`;

    const { data } = await axios.post(
      url,
      {
        query,
        variables: variables || {},
      },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      },
    );

    if (data.errors) {
      throw data.errors;
    }

    return data.data;
  }
}
