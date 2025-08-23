import { Express } from './Express.ts';
import { existsSync } from './fs.ts';

const app = new Express();
app.get('/*', (req, test, a) => {
	console.log(req.pathname, test, a);

	if (req.pathname == '/') {
		return new Response(Deno.readFileSync('app/index.html'));
	}
	const filePath = 'app' + req.pathname;
	if (existsSync(filePath)) return new Response(Deno.readFileSync(filePath));
});
app.listen(8000);
