import { Express } from './Express.ts';
import { existsSync } from './fs.ts';
import * as esbuild from 'esbuild';
const app = new Express();

app.get('/users/:id', (ctx, res) => res.text(`User ${ctx.params.id}`));
app.post('/users', (_, res) => res.text('Create user'));
app.put('/users/:id', (ctx, res) => res.text(`Update ${ctx.params.id}`));
app.delete('/users/:id', (ctx, res) => res.text(`Delete ${ctx.params.id}`));
app.get('/*', (req, res) => {
	console.log(req.params, res);

	if (req.pathname == '/') {
		return res.send(Deno.readFileSync('app/index.html'));
		// return new Response(Deno.readFileSync('app/index.html'));
	}
	const filePath = 'app' + req.pathname;
	if (req.pathname.endsWith('.ts')) {
		const BUNDLE = false;
		if (BUNDLE) {
			const build = esbuild.buildSync({
				entryPoints: [filePath],
				bundle: true,
				write: false,
			});
			const contents = build.outputFiles[0].contents;
			return res.header('Content-Type', 'text/javascript').send(contents);
		}
		const transpiles = esbuild.transformSync(
			Deno.readTextFileSync(filePath),
			{ loader: 'ts' }
		);
		return res
			.header('Content-Type', 'text/javascript')
			.send(transpiles.code);
	}
	if (existsSync(filePath)) return res.send(Deno.readFileSync(filePath));
});
app.listen(8000);
