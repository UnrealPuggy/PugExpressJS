export async function exists(path: string, dir?: boolean) {
	try {
		const info = await Deno.stat(path);
		return dir ? info.isDirectory : info.isFile;
	} catch {
		return false;
	}
}
export function existsSync(path: string, dir?: boolean) {
	try {
		const info = Deno.statSync(path);
		return dir ? info.isDirectory : info.isFile;
	} catch {
		return false;
	}
}
