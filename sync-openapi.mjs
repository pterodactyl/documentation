import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

const panel = resolve(process.argv[2] ?? '../panel-next');
const output = execFileSync('php', ['-r', `
require $argv[1].'/vendor/autoload.php';
$spec = Symfony\\Component\\Yaml\\Yaml::parseFile($argv[1].'/storage/app/private/scribe/openapi.yaml', Symfony\\Component\\Yaml\\Yaml::PARSE_OBJECT_FOR_MAP);
echo json_encode($spec, JSON_THROW_ON_ERROR);
`, panel], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const spec = JSON.parse(output);
spec.info.title = 'Pterodactyl 2.0 API Reference';
spec.info.version = '2.0.0-dev';
spec.servers = [{ url: 'https://panel.example.com', description: 'Replace with your panel URL' }];
const session = spec.components?.securitySchemes?.panelSession;
if (session) {
  session.name = 'pterodactyl_session';
  session.description = 'Browser session cookie. This is the default name; SESSION_COOKIE or APP_NAME can change it for a deployment.';
}
await writeFile('./openapi-v2.json', JSON.stringify(spec, null, 2) + '\n');
await import('./generate-openapi.mjs');
