type RouteHandler = (req?: Request) => Response | void;
type HTTPMethod = 'GET' | 'POST' | 'PUT';
type Route = { path: string; handler: RouteHandler };
export class Express {
	private routes: Partial<Record<HTTPMethod, Route[]>> = {};
	get(path: string, handler: RouteHandler): void {
		this.routes.GET ??= [];
		this.routes.GET.push({ path, handler });
	}
	/**
	 * @description Matches the first argument against the second.
	 * The second can have custom stuff like `:id`, or wildcard `*`
	 * @param pathToMath
	 * @param path
	 * @returns
	 */
	matchPath(pathToMath: string, path: string) {
		return pathToMath == path;
	}
	listen(port: number, options?: Deno.ServeTcpOptions) {
		return Deno.serve({ port, ...options }, (req) => {
			const url = new URL(req.url);
			const pathname = url.pathname;

			// Method Stuff
			const methodRoutes = this.routes[req.method as HTTPMethod] ?? [];
			const foundRoute = methodRoutes.find((route) =>
				this.matchPath(pathname, route.path)
			);
			if (methodRoutes && foundRoute) {
				const callback = foundRoute.handler(req);
				if (callback) return callback;
			}
			return new Response('Not Found', {
				status: 404,
				headers: { 'Content-Type': 'text/plain' },
			});
		});
	}
}
