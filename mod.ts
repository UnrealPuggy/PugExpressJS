import { Express } from './Express.ts';

const app = new Express();
app.get('/', () => {
	return new Response('I like pugs');
});
app.listen(8000);
