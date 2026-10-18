import { html, raw, esc, SafeHtml } from './html.ts';
import type { User } from '../db.ts';

export interface Assets { head: (entry: string) => string; scripts: (entry: string) => string }
export interface PageCtx { user?: User; csrf: string; assets: Assets; isAdmin: boolean; flash?: { kind: 'ok' | 'err'; text: string } }

export const SITE_NAME = 'Su Pazarı';
const logo = raw(`<svg viewBox="0 0 40 24" width="34" height="20" aria-hidden="true" focusable="false"><path d="M2 12c6-9 17-11 25-3l9-5v16l-9-5c-8 8-19 6-25-3z" fill="currentColor"/><circle cx="10" cy="10.5" r="1.6" fill="var(--bg)"/></svg>`);

export function layout(ctx: PageCtx, o: { title: string; description?: string; entry?: string; body: SafeHtml; main?: string; path?: string }): string {
  const { user } = ctx;
  const nav = (href: string, label: string) => html`<a href="${href}"${o.path === href ? raw(' aria-current="page"') : ''}>${label}</a>`;
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${esc(o.title)} · ${SITE_NAME}</title>
<meta name="description" content="${esc(o.description ?? 'Gerçek fotoğraflı akvaryum balığı ilanları; tür, şekil ve renk için temsili 3B görünüm.')}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${ctx.assets.head(o.entry ?? 'site')}
</head>
<body>
<a class="skip" href="#icerik">Ana içeriğe geç</a>
<header class="topbar">
  <div class="wrap topbar-in">
    <a class="brand" href="/" aria-label="${SITE_NAME} ana sayfa">${logo}<span>${SITE_NAME}</span></a>
    <nav class="nav" aria-label="Ana gezinme">
      ${nav('/ilanlar', 'İlanlar')}
      ${nav('/ilan/yeni', 'İlan ver')}
      ${user
        ? html`<a class="nav-user" href="/satici/${user.id}"${o.path === '/satici/' + user.id ? raw(' aria-current="page"') : ''}>${user.display_name}</a>
          <form method="post" action="/cikis" class="inline"><input type="hidden" name="_csrf" value="${ctx.csrf}"><button class="linklike" type="submit">Çıkış</button></form>`
        : html`${nav('/giris', 'Giriş')}<a class="btn btn-small" href="/kayit">Kayıt ol</a>`}
    </nav>
  </div>
</header>
<main id="icerik" class="${o.main ?? 'wrap'}" tabindex="-1">
${ctx.flash ? html`<p class="flash flash-${ctx.flash.kind}" role="status">${ctx.flash.text}</p>`.value : ''}
${o.body.value}
</main>
<footer class="footer">
  <div class="wrap">
    <p><strong>${SITE_NAME}</strong> yerel geliştirme sürümüdür. İlanlar gerçek satıcı beyanıdır, siteden ödeme ya da mesajlaşma yapılmaz; alıcı ile satıcı iletişim bilgilerinden anlaşır.</p>
    <p>3B görünümler şematik ve temsilidir; satılan balığın birebir görüntüsü değildir. Satın almadan önce gerçek fotoğraflara bakın, mümkünse balığı yerinde görün.</p>
  </div>
</footer>
${o.entry ? ctx.assets.scripts(o.entry) : ctx.assets.scripts('site')}
</body>
</html>`;
}

export const csrfField = (ctx: PageCtx) => html`<input type="hidden" name="_csrf" value="${ctx.csrf}">`;
