import { InternalError, NotFoundError, ValidationError } from '../../errors/app-error';
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
  const product = await productRepository.getProductById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const newStock = product.stock + quantity;

  const updated = await productRepository.updateStock(id, newStock);
  if (!updated) {
    throw new InternalError('Failed to update stock');
  }
  return updated;
};

export const sellProduct = async (
  id: number,
  quantity: number,
): Promise<Product> => {
  const product = await productRepository.getProductById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (quantity > product.stock) {
    throw new ValidationError({
      stock: `Insufficient stock: requested ${quantity}, available ${product.stock}`,
    });
  }

  const newStock = product.stock - quantity;

  const updated = await productRepository.updateStock(id, newStock);
  if (!updated) {
    throw new InternalError('Failed to update stock');
  }
  return updated;
};
