export type ExpressRequest = { req: Request; pathname: string; url: URL };

type RouteHandler = (req: ExpressRequest, ...args: string[]) => Response | void;
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
		const newPath = new RegExp(
			`^${path
				.replaceAll('*', '(.*)')
				// .replaceAll(/:([a-zA-Z]+)\?/g, '([^/]+)?')
				.replaceAll(/:([a-zA-Z]+)/g, '([^/]+)')}$`
		);
		const match = pathToMath.match(newPath);
		// console.log('Match');
		return { args: match?.slice(1) ?? [], suceed: match != null };
		// return match;
	}
	listen(port: number, options?: Deno.ServeTcpOptions) {
		return Deno.serve({ port, ...options }, (req) => {
			const url = new URL(req.url);
			const pathname = url.pathname;
			// Method Stuff
			const methodRoutes = this.routes[req.method as HTTPMethod] ?? [];
			for (const route of methodRoutes) {
				const match = this.matchPath(pathname, route.path);
				if (methodRoutes && route && match.suceed) {
					const callback = route.handler(
						{ url, pathname, req },
						...match.args
					);
					if (callback) return callback;
				}
			}

			return new Response('Not Found', {
				status: 404,
				headers: { 'Content-Type': 'text/plain' },
			});
		});
	}
}
