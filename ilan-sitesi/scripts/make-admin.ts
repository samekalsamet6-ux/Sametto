// Yerel yönetici atama komutu: `npm run make-admin -- kisi@ornek.com`
// Yalnızca sunucuda, veri klasörüne erişimi olan işletmeci çalıştırabilir; web arayüzünden yönetici yapılamaz.
// Hesap önce normal şekilde kayıt olmuş olmalıdır. Kaldırmak için: `npm run make-admin -- --remove kisi@ornek.com`
import { loadDotEnv, readConfig } from '../server/config.ts';
import { openDb, setAdmin } from '../server/db.ts';
import { normalizeEmail } from '../server/validation.ts';

loadDotEnv();
const args = process.argv.slice(2);
const remove = args.includes('--remove');
const email = normalizeEmail(args.find((a) => !a.startsWith('--')) ?? '');
if (!email) { console.error('Kullanım: npm run make-admin -- [--remove] <e-posta>'); process.exit(2); }
const cfg = readConfig();
const db = openDb(cfg.dbPath);
if (!setAdmin(db, email, !remove)) { console.error(`Bu e-posta ile kayıtlı hesap yok: ${email} (önce siteden kayıt olun).`); db.close(); process.exit(1); }
console.log(remove ? `Yönetici yetkisi kaldırıldı: ${email}` : `Yönetici yapıldı: ${email}`);
db.close();
