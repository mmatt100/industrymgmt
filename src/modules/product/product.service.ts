import {
  ConflictError,
  InternalError,
  NotFoundError,
} from '../../errors/app-error';
import { productRepository } from './product.repository';
import type { Product, CreateProductInput } from './product.repository';

export const listProducts = async (): Promise<Product[]> => {
  return productRepository.listProducts();
};

export const createProduct = async (
  input: CreateProductInput,
): Promise<Product> => {
  const product = await productRepository.createProduct(input);
  if (!product) {
    throw new InternalError('Failed to create product');
  }
  return product;
};

export const restockProduct = async (
  id: number,
  quantity: number,
): Promise<Product> => {
  const updated = await productRepository.increaseStock(id, quantity);
  if (!updated) {
    throw new NotFoundError('Product not found');
  }
  return updated;
};

export const sellProduct = async (
  id: number,
  quantity: number,
): Promise<Product> => {
  const result = await productRepository.decreaseStock(id, quantity);
  if (result.status === 'not_found') {
    throw new NotFoundError('Product not found');
  }
  if (result.status === 'insufficient') {
    throw new ConflictError('Insufficient stock', {
      stock: `Insufficient stock: requested ${quantity}, available ${result.available}`,
    });
  }
  return result.product;
};
