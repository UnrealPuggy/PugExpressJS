import { Express } from './Express.ts';

const app = new Express();
app.get('/*', (req, test) => {
	console.log(req.pathname, test);
	if (req.pathname == '/') {
		return new Response(Deno.readFileSync('app/index.html'));
	}
	return new Response(Deno.readFileSync('app' + req.pathname));
});
app.listen(8000);
