export type ExpressRequest = {
	req: Request;
	pathname: string;
	url: URL;
	params: Record<string, string>;
};

type RouteHandler = (
	req: ExpressRequest,
	res: Res,
	next: () => void
) => Response | void;
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
	// use(handler: RouteHandler) {
	// 	this.routes.USE ??= [];
	// 	this.routes.USE.push({ handler, path: '*' });
	// }

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
					let c = false;
					const next = () => {
						c = true;
					};
					const _callback = route.handler(
						{ url, pathname, req, params: match.args },
						res,
						next
					);

					if (!c) break;

					// if (callback) return callback;
					// break;
				}
			}
			return res.toResponse();
			// return res.status(404).text('Not Found');
			// return new Response('Not Found', {
			// status: 404,
			// headers: { 'Content-Type': 'text/plain' },
			// });
		});
	}
}
export class Res {
	headers: Headers = new Headers();
	resInit: ResponseInit = { status: 200 };
	bodyInit: BodyInit | null = null;
	status(code: number) {
		this.resInit.status = code;
		return this;
	}

	header(key: string, value: string) {
		this.headers.set(key, value);
		return this;
	}
	send(data: BodyInit | null, resinit = this.resInit) {
		this.bodyInit = data;
		this.resInit = resinit;
	}
	json(data: object) {
		this.header('Content-Type', 'application/json');
		// this.resInit.status
		this.bodyInit = JSON.stringify(data);
	}

	text(message: string) {
		this.header('Content-Type', 'text/plain');
		this.bodyInit = message;
	}
	redirect(url: string, code = 302) {
		this.resInit.status = code;
		this.headers.set('Location', url);
		this.bodyInit = `Redirecting to ${url}`;
	}
	toResponse(): Response {
		return new Response(this.bodyInit, this.resInit);
	}
}
