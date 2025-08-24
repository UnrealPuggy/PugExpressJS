export type ExpressRequest = {
	req: Request;
	pathname: string;
	url: URL;
	params: Record<string, string>;
};

type RouteHandler = (req: ExpressRequest, res: Res) => Response | void;
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
type Route = { path: string; handler: RouteHandler };
export class Express {
	private routes: Partial<Record<HTTPMethod, Route[]>> = {};
	get(path: string, handler: RouteHandler): void {
		this.routes.GET ??= [];
		this.routes.GET.push({ path, handler });
	}
	post(path: string, handler: RouteHandler): void {
		this.routes.POST ??= [];
		this.routes.POST.push({ path, handler });
	}
	put(path: string, handler: RouteHandler): void {
		this.routes.PUT ??= [];
		this.routes.PUT.push({ path, handler });
	}
	delete(path: string, handler: RouteHandler): void {
		this.routes.DELETE ??= [];
		this.routes.DELETE.push({ path, handler });
	}

	/**
	 * @description Matches the first argument against the second.
	 * The second can have custom stuff like `:id`, or wildcard `*`
	 * @param pathToMath
	 * @param path
	 * @returns
	 */
	matchPath(pathToMath: string, path: string) {
		const paramNames: string[] = [];
		const newPath = new RegExp(
			`^${path
				.replaceAll('*', '(.*)')
				// .replaceAll(/:([a-zA-Z]+)\?/g, '([^/]+)?')
				.replaceAll(/:([a-zA-Z]+)/g, (_, name) => {
					paramNames.push(name);
					return '([^/]+)';
				})}$`
		);
		const match = pathToMath.match(newPath);

		const obj: Record<string, string> = Object.fromEntries(
			paramNames.map((key, i) => [key, match?.slice(1)?.[i] ?? ''])
		);

		return { args: obj, suceed: match != null };
		// return match;
	}
	listen(port: number, options?: Deno.ServeTcpOptions) {
		return Deno.serve({ port, ...options }, (req) => {
			const url = new URL(req.url);
			const pathname = url.pathname;
			const res = new Res();
			// Method Stuff
			const methodRoutes = this.routes[req.method as HTTPMethod] ?? [];
			for (const route of methodRoutes) {
				const match = this.matchPath(pathname, route.path);
				if (methodRoutes && route && match.suceed) {
					const callback = route.handler(
						{ url, pathname, req, params: match.args },
						res
					);
					if (callback) return callback;
					break;
				}
			}
			return res.status(404).text('Not Found');
			// return new Response('Not Found', {
			// status: 404,
			// headers: { 'Content-Type': 'text/plain' },
			// });
		});
	}
}
export class Res {
	statusCode: number = 200;
	headers: Headers = new Headers();

	status(code: number) {
		this.statusCode = code;
		return this;
	}

	header(key: string, value: string) {
		this.headers.set(key, value);
		return this;
	}
	send(data: BodyInit | null) {
		return new Response(data, {
			status: this.statusCode,
			headers: this.headers,
		});
	}
	json(data: unknown) {
		this.header('Content-Type', 'application/json');
		return new Response(JSON.stringify(data), {
			status: this.statusCode,
			headers: this.headers,
		});
	}

	text(message: string) {
		this.header('Content-Type', 'text/plain');
		return new Response(message, {
			status: this.statusCode,
			headers: this.headers,
		});
	}
	redirect(url: string, code = 302) {
		this.statusCode = code;
		this.headers.set('Location', url);
		// You can send a small message or empty body
		return new Response(`Redirecting to ${url}`, {
			status: this.statusCode,
			headers: this.headers,
		});
	}
}
