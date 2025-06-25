import { Router } from 'express';
import ProductController from '../controller/ProductController';
import * as multer from 'multer';

const upload = multer({ storage: ProductController.getStorage() });

const productRouter = Router();
productRouter.post('/uploadSearch', upload.single('file'), ProductController.uploadSearch);
productRouter.post('/similar', ProductController.getSimilarProducts);
productRouter.get('/filter', ProductController.getFilters);
productRouter.post('/allProducts', ProductController.searchProduct)
productRouter.get('/:productId', ProductController.searchProductById)

export default productRouter;
