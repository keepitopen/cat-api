import express from 'express';
import cors from 'cors';

import catRoutes from './app/routes/catRoutes';

const app = express();
app.use(cors());

catRoutes(app);

app.listen(3002, () => {
    console.log('server running at port 3002');
});
