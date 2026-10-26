import { Injectable } from '@nestjs/common';
import * as Typesense from 'typesense';

@Injectable()
export class TypesenseService {
  private client: Typesense.Client;
  private collectionName = 'properties';

  constructor() {
    this.client = new Typesense.Client({
      nodes: [
        {
          host: process.env.TYPESENSE_HOST || 'localhost',
          port: Number(process.env.TYPESENSE_PORT) || 8108,
          protocol: process.env.TYPESENSE_PROTOCOL || 'http',
        },
      ],
      apiKey: process.env.TYPESENSE_API_KEY || 'xyz123',
      connectionTimeoutSeconds: 5,
    });

    this.createCollection();
  }

  getClient() {
    return this.client;
  }

  getCollectionName() {
    return this.collectionName;
  }

  async createCollection() {
    const schema: any = {
      name: 'properties',
      fields: [
        { name: 'id', type: 'string', facet: false },
        { name: 'title_es', type: 'string', facet: false },
        { name: 'title_en', type: 'string', facet: false },
        { name: 'description_es', type: 'string', facet: false },
        { name: 'description_en', type: 'string', facet: false },
        { name: 'price', type: 'int32', facet: true },
        { name: 'type', type: 'string', facet: true },
        { name: 'status', type: 'string', facet: true },
        { name: 'operation', type: 'string', facet: true },
        { name: 'rooms', type: 'int32', facet: true },
        { name: 'bathrooms', type: 'int32', facet: true },
        { name: 'sqm', type: 'int32', facet: true },
        { name: 'address', type: 'string', facet: false },
        { name: 'city', type: 'string', facet: true },
        { name: 'state', type: 'string', facet: true },
        { name: 'country', type: 'string', facet: true },
        { name: 'agentId', type: 'string', facet: true },
      ],
      default_sorting_field: 'price',
    };

    try {
      await this.client.collections(this.collectionName).retrieve();
    } catch (err) {
      await this.client.collections().create(schema);
    }
  }

  async createUsersCollection() {
    const schema: any = {
      name: 'users',
      fields: [
        { name: 'id', type: 'string', facet: false },
        { name: 'name', type: 'string', facet: false },
        { name: 'email', type: 'string', facet: false },
        { name: 'role', type: 'string', facet: true },
      ],
    };

    try {
      await this.client.collections('users').retrieve();
    } catch (err) {
      await this.client.collections().create(schema);
    }
  }
}
