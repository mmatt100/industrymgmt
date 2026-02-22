import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './lib/config';
import contactRouter from './modules/contact/contact.router';
import healthRouter from './modules/health/health.router';
import productRouter from './modules/product/product.router';
import orderRouter from './modules/order/order.router';
import { errorHandler } from './middleware/error-handler';
import { loggerMiddleware } from './middleware/logger';
import { rateLimiter } from './middleware/rate-limit';
import { requestId } from './middleware/request-id';

const app = express();

app.use('/health', healthRouter);

app.use(requestId);
app.use(loggerMiddleware);

app.use(helmet());
app.use(cors());
if (config.NODE_ENV !== 'test') {
  app.use(rateLimiter);
}
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/contacts', contactRouter);
app.use('/products', productRouter);
app.use('/orders', orderRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', requestId: req.id });
});

app.use(errorHandler);

export default app;
