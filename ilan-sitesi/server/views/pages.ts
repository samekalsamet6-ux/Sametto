import { html, raw, esc, type SafeHtml } from './html.ts';
import { layout, csrfField, SITE_NAME, type PageCtx } from './layout.ts';
import { CATALOG, OTHER_ID, speciesById, speciesLabel, sexOptions, UNKNOWN_SEX } from '../../shared/catalog.ts';
import { CITIES } from '../../shared/cities.ts';
import { formatPrice, formatPhone, REPORT_REASONS, type Errors } from '../validation.ts';
import { PAGE_SIZE, SORTS, type SearchParams } from '../search.ts';
import type { Listing, Photo, ReportRow } from '../db.ts';

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const itemName = (list: { id: string; ad: string }[], id: string | null) => list.find((x) => x.id === id)?.ad ?? null;

export function sexLabel(speciesId: string, sex: string): string {
  if (sex === UNKNOWN_SEX) return 'Cinsiyet bilinmiyor / karışık';
  return sexOptions(speciesId).find((s) => s.id === sex)?.ad ?? sex;
}
export function listingFacts(l: Listing): { species: string; form: string | null; variant: string | null; sex: string } {
  const sp = speciesById(l.species_id);
  return { species: speciesLabel(l.species_id, l.species_other), form: sp ? itemName(sp.forms, l.form_id) : null, variant: sp ? itemName(sp.variants, l.variant_id) : null, sex: sexLabel(l.species_id, l.sex) };
}

const local = (n?: string | null) => (n ? '0' + n.slice(2) : '');
const err = (errors: Errors, k: string) => (errors[k] ? html`<p class="field-err" id="${k}-err">${errors[k]}</p>` : '');
const invalid = (errors: Errors, k: string) => (errors[k] ? raw(` aria-invalid="true" aria-describedby="${k}-err"`) : '');

// ---------- ilan kartı ----------
export function listingCard(l: Listing): SafeHtml {
  const f = listingFacts(l);
  const demo = l.is_demo ? html`<span class="tag tag-demo">Örnek ilan</span>` : '';
  return html`<li class="card">
  <a class="card-link" href="/ilan/${l.id}">
    <span class="card-photo">${l.first_photo ? html`<img src="/yuklemeler/${l.first_photo}" alt="${f.species} ilanının satıcı fotoğrafı" loading="lazy" width="400" height="300">` : ''}${demo}</span>
    <span class="card-body">
      <span class="card-title">${l.title}</span>
      <span class="card-meta">${[f.species, f.form, f.variant].filter(Boolean).join(' · ')}</span>
      <span class="card-row"><strong class="price">${formatPrice(l.price_kurus)}</strong><span class="muted">${l.quantity} adet · ${l.city}</span></span>
    </span>
  </a>
</li>`;
}
const cardGrid = (items: Listing[]) => html`<ul class="grid" role="list">${items.map(listingCard)}</ul>`;

// ---------- ana sayfa ----------
export function homePage(ctx: PageCtx, latest: Listing[]): string {
  const body = html`
<section class="hero">
  <div class="hero-text">
    <p class="eyebrow">Akvaryum balığı ilanları</p>
    <h1>Balığı fotoğrafta görün, <em>3B'de</em> tanıyın.</h1>
    <p class="lead">Her ilanda satıcının yüklediği gerçek fotoğraflar zorunludur. Yanında tür, şekil ve rengi gösteren temsili bir 3B model bulunur; böylece "delta kuyruk" ya da "halfmoon" gibi tarifler ne demek, hemen anlaşılır.</p>
    <p class="hero-cta"><a class="btn" href="/ilanlar">İlanlara göz at</a> <a class="btn btn-ghost" href="/ilan/yeni">İlan ver</a></p>
  </div>
  <div class="hero-art" aria-hidden="true">
    <svg viewBox="0 0 320 220" class="hero-svg"><defs><linearGradient id="hg" x1="0" x2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--coral)"/></linearGradient></defs>
      <path d="M40 112c34-58 112-70 168-22l66-34v112l-66-34c-56 48-134 36-168-22z" fill="url(#hg)" opacity=".92"/><circle cx="84" cy="100" r="7" fill="var(--bg)"/><circle cx="86" cy="99" r="3" fill="var(--ink)"/>
      <circle cx="250" cy="40" r="8" fill="none" stroke="var(--accent)" stroke-width="2"/><circle cx="274" cy="18" r="5" fill="none" stroke="var(--accent)" stroke-width="2"/><circle cx="232" cy="14" r="3" fill="none" stroke="var(--accent)" stroke-width="2"/></svg>
  </div>
</section>

<section aria-labelledby="turler-b">
  <h2 id="turler-b">3B modeli olan ${CATALOG.length} tür</h2>
  <ul class="chips" role="list">${CATALOG.map((s) => html`<li><a class="chip" href="/ilanlar?tur=${s.id}">${s.ad}</a></li>`)}<li><a class="chip chip-quiet" href="/ilanlar?tur=${OTHER_ID}">Diğer türler</a></li></ul>
  <p class="muted">Listede olmayan bir tür de ilan edilebilir; o ilanda 3B model olmaz, yalnızca fotoğraflar gösterilir.</p>
</section>

<section aria-labelledby="son-b">
  <div class="section-head"><h2 id="son-b">Son ilanlar</h2><a href="/ilanlar">Tümünü gör</a></div>
  ${latest.length ? cardGrid(latest) : html`<p class="empty">Henüz ilan yok. İlk ilanı siz verin.</p>`}
</section>

<section class="how" aria-labelledby="nasil-b">
  <h2 id="nasil-b">Nasıl çalışır?</h2>
  <ol class="steps">
    <li><strong>Gerçek fotoğraf yükleyin.</strong> 1–5 fotoğraf olmadan ilan yayınlanmaz; filtre ve listelerde de ilk fotoğraf görünür.</li>
    <li><strong>Tür, şekil, renk ve cinsiyeti seçin.</strong> Form doldururken 3B model seçiminize göre canlı güncellenir.</li>
    <li><strong>İletişim bilgisi bırakın.</strong> Sitede mesajlaşma ve ödeme yoktur; alıcılar WhatsApp numaranız ya da telefonunuzla size ulaşır.</li>
  </ol>
  <p class="note">Dürüst not: 3B model şematik bir yorumdur. Gerçek balığın rengi, desen yoğunluğu ve yüzgeç biçimi farklı olabilir; karar verirken her zaman satıcının fotoğraflarına güvenin.</p>
</section>`;
  return layout(ctx, { title: 'Balık ilanları', body, path: '/', entry: 'site' });
}

// ---------- ilan listesi / arama ----------
export function listingsPage(ctx: PageCtx, o: { params: SearchParams; result: { items: Listing[]; total: number; page: number; pages: number } }): string {
  const p = o.params, r = o.result;
  const qs = (extra: Record<string, string | number>) => {
    const u = new URLSearchParams();
    const base: Record<string, string | undefined> = { tur: p.species, sekil: p.form, renk: p.variant, sehir: p.city, min: p.minPrice, max: p.maxPrice, sirala: p.sort };
    for (const [k, v] of Object.entries({ ...base, ...extra })) if (v !== undefined && v !== '') u.set(k, String(v));
    return u.toString();
  };
  const sp = p.species ? speciesById(p.species) : undefined;
  const selectedForm = p.form ?? '', selectedVar = p.variant ?? '';
  const formOptions = sp ? sp.forms : [];
  const varOptions = sp ? sp.variants : [];
  const body = html`
<h1>İlanlar</h1>
<form class="filters" method="get" action="/ilanlar" id="filtre" aria-label="İlanları filtrele">
  <div class="f">
    <label for="f-tur">Tür</label>
    <select id="f-tur" name="tur"><option value="">Tümü</option>${CATALOG.map((s) => html`<option value="${s.id}"${p.species === s.id ? raw(' selected') : ''}>${s.ad}</option>`)}<option value="${OTHER_ID}"${p.species === OTHER_ID ? raw(' selected') : ''}>Diğer türler</option></select>
  </div>
  <div class="f">
    <label for="f-sekil">Şekil</label>
    <select id="f-sekil" name="sekil"${sp ? '' : raw(' disabled')}><option value="">Tümü</option>${formOptions.map((x) => html`<option value="${x.id}"${selectedForm === x.id ? raw(' selected') : ''}>${x.ad}</option>`)}</select>
  </div>
  <div class="f">
    <label for="f-renk">Renk</label>
    <select id="f-renk" name="renk"${sp ? '' : raw(' disabled')}><option value="">Tümü</option>${varOptions.map((x) => html`<option value="${x.id}"${selectedVar === x.id ? raw(' selected') : ''}>${x.ad}</option>`)}</select>
  </div>
  <div class="f">
    <label for="f-sehir">Şehir</label>
    <select id="f-sehir" name="sehir"><option value="">Tüm şehirler</option>${CITIES.map((c) => html`<option${p.city === c ? raw(' selected') : ''}>${c}</option>`)}</select>
  </div>
  <div class="f f-price">
    <label for="f-min">Fiyat (₺)</label>
    <div class="pair"><input id="f-min" name="min" inputmode="decimal" placeholder="en az" value="${p.minPrice ?? ''}" aria-label="En düşük fiyat"><span aria-hidden="true">–</span><input id="f-max" name="max" inputmode="decimal" placeholder="en çok" value="${p.maxPrice ?? ''}" aria-label="En yüksek fiyat"></div>
  </div>
  <div class="f">
    <label for="f-sirala">Sırala</label>
    <select id="f-sirala" name="sirala">${Object.entries(SORTS).map(([k, v]) => html`<option value="${k}"${(p.sort ?? 'yeni') === k ? raw(' selected') : ''}>${v.ad}</option>`)}</select>
  </div>
  <div class="f f-actions"><button class="btn" type="submit">Ara</button> <a class="btn btn-ghost" href="/ilanlar">Temizle</a></div>
</form>
<p class="result-count" role="status" aria-live="polite" data-testid="sonuc-sayisi">${r.total} ilan bulundu</p>
<p class="muted small">Liste görünümünde yalnızca satıcının gerçek fotoğrafı gösterilir; 3B model ilan sayfasındadır.</p>
${r.items.length ? cardGrid(r.items) : html`<p class="empty">Bu ölçütlere uyan ilan yok. Filtreleri gevşetmeyi deneyin.</p>`}
${r.pages > 1 ? html`<nav class="pager" aria-label="Sayfalar">
  ${r.page > 1 ? html`<a class="btn btn-ghost" rel="prev" href="/ilanlar?${qs({ sayfa: r.page - 1 })}">‹ Önceki</a>` : ''}
  <span>Sayfa ${r.page} / ${r.pages}</span>
  ${r.page < r.pages ? html`<a class="btn btn-ghost" rel="next" href="/ilanlar?${qs({ sayfa: r.page + 1 })}">Sonraki ›</a>` : ''}
</nav>` : ''}`;
  void PAGE_SIZE;
  return layout(ctx, { title: 'İlanlar', body, path: '/ilanlar', entry: 'ilanlar' });
}

// ---------- ilan detayı ----------
export function detailPage(ctx: PageCtx, o: { l: Listing; photos: Photo[]; alreadyReported: boolean; reportErrors?: Errors; reported?: boolean }): string {
  const { l, photos } = o;
  const f = listingFacts(l);
  const sp = speciesById(l.species_id);
  const isOwner = ctx.user?.id === l.user_id;
  const wa = l.seller_whatsapp, ph = l.seller_phone;
  const waText = encodeURIComponent(`Merhaba, ${SITE_NAME} üzerindeki "${l.title}" ilanınız hakkında yazıyorum.`);
  const facts: [string, string][] = [['Tür', f.species]];
  if (f.form) facts.push(['Şekil', f.form]);
  if (f.variant) facts.push(['Renk', f.variant]);
  facts.push(['Cinsiyet', f.sex], ['Adet', String(l.quantity)], ['Şehir', l.city], ['İlan tarihi', fmtDate(l.created_at)]);
  const body = html`
<nav class="crumbs" aria-label="Sayfa yolu"><a href="/ilanlar">İlanlar</a> <span aria-hidden="true">/</span> <a href="/ilanlar?tur=${l.species_id}">${f.species}</a></nav>
<article class="detail" data-listing="${l.id}">
  <header class="detail-head">
    <h1>${l.title}</h1>
    <p class="detail-price"><strong class="price">${formatPrice(l.price_kurus)}</strong> ${l.quantity > 1 ? html`<span class="muted">(toplam, ${l.quantity} adet için satıcının beyanı)</span>` : ''}</p>
    ${l.is_demo ? html`<p class="tag tag-demo">Örnek ilan — gerçek bir satış değildir</p>` : ''}
  </header>
  <div class="detail-grid">
    <section class="photos" aria-label="Gerçek fotoğraflar">
      <h2 class="sr-only">Satıcının gerçek fotoğrafları</h2>
      <div class="photo-main"><img id="foto-ana" src="/yuklemeler/${photos[0]?.file ?? ''}" alt="${l.title}: satıcı fotoğrafı 1 / ${photos.length}" width="800" height="600"></div>
      ${photos.length > 1 ? html`<ul class="thumbs" role="list">${photos.map((ph, i) => html`<li><button type="button" class="thumb" data-src="/yuklemeler/${ph.file}" data-alt="${l.title}: satıcı fotoğrafı ${i + 1} / ${photos.length}" aria-label="Fotoğraf ${i + 1}" aria-pressed="${i === 0 ? 'true' : 'false'}"><img src="/yuklemeler/${ph.file}" alt="" loading="lazy" width="96" height="72"></button></li>`)}</ul>` : ''}
      <p class="muted small">Bunlar satıcının yüklediği fotoğraflardır.</p>
    </section>
    <section class="model3d" aria-labelledby="m3d-baslik">
      ${sp
        ? html`<h2 id="m3d-baslik" class="label3d" data-testid="etiket-3b">Temsili 3B görünüm — gerçek balık fotoğrafları <span class="w-wide">solda</span><span class="w-narrow">yukarıda</span></h2>
      <div class="stage" id="sahne" data-species="${l.species_id}" data-form="${l.form_id ?? ''}" data-variant="${l.variant_id ?? ''}" data-sex="${l.sex}">
        <canvas id="cv" tabindex="0" role="img" aria-label="${f.species} için temsili 3B model; sürükleyerek döndürebilirsiniz"></canvas>
        <div class="hot" id="ov" hidden></div>
        <p class="stage-status" id="durum" role="status">3B model yükleniyor…</p>
        <p class="stage-fallback" id="yedek" hidden>Bu tarayıcıda 3B görünüm açılamadı (WebGL kapalı ya da desteklenmiyor). İlanın fotoğrafları ve bilgileri yine de geçerlidir.</p>
      </div>
      <div class="viewbar" id="gorunum" role="group" aria-label="Bakış açısı" hidden>${sp.views.slice(0, 4).map((v) => html`<button type="button" class="btn btn-small btn-ghost" data-view="${v.id}">${v.ad}</button>`)}<button type="button" class="btn btn-small btn-ghost" id="don" aria-pressed="false">Otomatik döndür</button></div>
      <p class="note small">Seçilen: ${[f.species, f.form, f.variant, f.sex].filter(Boolean).join(' · ')}. Model şematik bir yorumdur; gerçek balığın rengi ve yüzgeç biçimi farklı olabilir.${sp.not ? ' ' + sp.not : ''}</p>`
        : html`<h2 id="m3d-baslik">Bu tür için 3B model yok</h2><p class="note">“${f.species}” 3B kataloğumuzda bulunmuyor; bu ilanda yalnızca satıcının gerçek fotoğrafları gösterilir.</p>`}
    </section>
    <section class="info" aria-labelledby="bilgi-b">
      <h2 id="bilgi-b">Balık bilgileri</h2>
      <dl class="facts">${facts.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
      <h2>Açıklama</h2>
      <p class="desc">${l.description}</p>
    </section>
    <aside class="seller" aria-labelledby="satici-b">
      <h2 id="satici-b">Satıcı</h2>
      <p><a href="/satici/${l.user_id}">${l.seller_name}</a></p>
      ${wa || ph
        ? html`<ul class="contact" role="list">
          ${wa ? html`<li><span class="muted">WhatsApp:</span> <strong>${formatPhone(wa)}</strong> <a class="btn btn-small" href="https://wa.me/${wa}?text=${waText}" rel="noopener noreferrer" target="_blank">WhatsApp'ta yaz</a></li>` : ''}
          ${ph ? html`<li><span class="muted">Telefon:</span> <strong>${formatPhone(ph)}</strong></li>` : ''}
        </ul>`
        : html`<p class="muted">Satıcı iletişim bilgisi eklememiş.</p>`}
      <p class="note small">Sitede ödeme ya da mesajlaşma yoktur. Parayı göndermeden önce balığı görmeyi ya da kanlı canlı görüntülü görüşmeyi tercih edin.</p>
      ${isOwner ? html`<form method="post" action="/ilan/${l.id}/kaldir" onsubmit="return confirm('İlan kaldırılsın mı? Fotoğrafları da silinir.')">${csrfField(ctx)}<button class="btn btn-danger btn-small" type="submit">İlanı kaldır</button></form>` : ''}
    </aside>
  </div>
  ${isOwner && !o.reported ? '' : html`<section class="report" aria-labelledby="sik-b">
    ${o.reported ? html`<p class="flash flash-ok" role="status">Şikayetiniz alındı. İlan incelenmek üzere işaretlendi, teşekkürler.</p>` : ''}
    ${o.alreadyReported && !o.reported ? html`<p class="muted">Bu ilanı daha önce şikayet ettiniz.</p>` : ''}
    ${!o.alreadyReported && !isOwner
      ? ctx.user
        ? html`<details${o.reportErrors && Object.keys(o.reportErrors).length ? raw(' open') : ''}><summary id="sik-b" class="linklike">Şikayet et</summary>
          <form method="post" action="/ilan/${l.id}/sikayet" class="stack">
            ${csrfField(ctx)}
            <label for="s-neden">Neden</label>
            <select id="s-neden" name="reason" required${invalid(o.reportErrors ?? {}, 'reason')}><option value="">Seçin…</option>${REPORT_REASONS.map((r) => html`<option value="${r.id}">${r.ad}</option>`)}</select>
            ${err(o.reportErrors ?? {}, 'reason')}
            <label for="s-not">Ek açıklama (isteğe bağlı)</label>
            <textarea id="s-not" name="note" rows="3" maxlength="500"></textarea>
            <button class="btn btn-danger btn-small" type="submit">Şikayeti gönder</button>
          </form></details>`
        : html`<p id="sik-b"><a href="/giris?next=/ilan/${l.id}">Şikayet etmek için giriş yapın</a></p>`
      : ''}
  </section>`}
</article>`;
  return layout(ctx, { title: l.title, description: `${f.species}${f.variant ? ' · ' + f.variant : ''} — ${l.city}, ${formatPrice(l.price_kurus)}`, body, entry: 'ilanDetay' });
}

// ---------- ilan formu ----------
export interface FormValues { species?: string; speciesOther?: string; form?: string; variant?: string; sex?: string; quantity?: string; price?: string; city?: string; title?: string; description?: string; whatsapp?: string; phone?: string }
export function listingFormPage(ctx: PageCtx, o: { values: FormValues; errors: Errors }): string {
  const v = o.values, e = o.errors;
  const sel = (cur: string | undefined, val: string) => (cur === val ? raw(' selected') : '');
  const sp = v.species ? speciesById(v.species) : undefined;
  const body = html`
<h1>İlan ver</h1>
<p class="lead small">Önce gerçek fotoğrafları ekleyin, sonra balığı tarif edin. Sağdaki 3B önizleme seçimlerinizle birlikte değişir; ilanda yalnızca temsili bir görünüm olarak yer alır.</p>
${Object.keys(e).length ? html`<div class="flash flash-err" role="alert" tabindex="-1" id="hata-ozeti"><strong>Formda düzeltilmesi gereken yerler var.</strong><ul>${Object.entries(e).map(([k, m]) => html`<li><a href="#${k === 'photos' ? 'foto' : k === 'species' ? 'tur' : k}">${m}</a></li>`)}</ul></div>` : ''}
<form class="listing-form" method="post" action="/ilan/yeni" enctype="multipart/form-data" novalidate>
  ${csrfField(ctx)}
  <div class="lf-main">
  <fieldset>
    <legend>1 · Gerçek fotoğraflar <span class="req">zorunlu</span></legend>
    <label for="foto">Fotoğraf seçin (1–5 adet; JPEG, PNG ya da WebP; her biri en çok 5 MB)</label>
    <input id="foto" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required${invalid(e, 'photos')}>
    ${err(e, 'photos')}
    <p class="muted small">Kendi balığınızın kendi çektiğiniz fotoğrafını yükleyin. Başkasından alınan ya da internetten bulunan görseller şikayet sebebidir. Seçilen dosyalar yeniden seçilmelidir (tarayıcılar sayfa yenilenince dosyaları tutmaz).</p>
    <ul class="previews" id="onizleme" role="list" aria-live="polite"></ul>
  </fieldset>
  <fieldset>
    <legend>2 · Balık</legend>
    <div class="row2">
      <div class="f"><label for="tur">Tür</label>
        <select id="tur" name="species" required${invalid(e, 'species')}><option value="">Seçin…</option>
          ${CATALOG.map((s) => html`<option value="${s.id}"${sel(v.species, s.id)}>${s.ad}</option>`)}
          <option value="${OTHER_ID}"${sel(v.species, OTHER_ID)}>Diğer (3B modeli yok)</option></select>${err(e, 'species')}</div>
      <div class="f" id="diger-kutu"${v.species === OTHER_ID ? '' : raw(' hidden')}><label for="speciesOther">Türün adı</label>
        <input id="speciesOther" name="speciesOther" maxlength="60" value="${v.speciesOther ?? ''}"${invalid(e, 'speciesOther')}>${err(e, 'speciesOther')}</div>
    </div>
    <div class="row2">
      <div class="f" id="sekil-kutu"><label for="form">Şekil (yüzgeç / vücut biçimi)</label>
        <select id="form" name="form"${invalid(e, 'form')}>${sp ? sp.forms.map((x) => html`<option value="${x.id}"${sel(v.form, x.id)}>${x.ad}</option>`) : html`<option value="">Önce tür seçin</option>`}</select>${err(e, 'form')}</div>
      <div class="f" id="renk-kutu"><label for="variant">Renk</label>
        <select id="variant" name="variant"${invalid(e, 'variant')}>${sp ? sp.variants.map((x) => html`<option value="${x.id}"${sel(v.variant, x.id)}>${x.ad}</option>`) : html`<option value="">Önce tür seçin</option>`}</select>${err(e, 'variant')}</div>
    </div>
    <div class="row3">
      <div class="f"><label for="sex">Cinsiyet</label>
        <select id="sex" name="sex" required${invalid(e, 'sex')}>${sexOptions(v.species ?? OTHER_ID).map((x) => html`<option value="${x.id}"${sel(v.sex ?? UNKNOWN_SEX, x.id)}>${x.ad}</option>`)}</select>${err(e, 'sex')}</div>
      <div class="f"><label for="quantity">Adet</label><input id="quantity" name="quantity" type="number" min="1" max="10000" inputmode="numeric" value="${v.quantity ?? '1'}" required${invalid(e, 'quantity')}>${err(e, 'quantity')}</div>
      <div class="f"><label for="price">Fiyat (₺)</label><input id="price" name="price" inputmode="decimal" placeholder="örn. 250 ya da 249,90" value="${v.price ?? ''}" required${invalid(e, 'price')}>${err(e, 'price')}</div>
    </div>
    <div class="f"><label for="city">Şehir</label>
      <select id="city" name="city" required${invalid(e, 'city')}><option value="">Seçin…</option>${CITIES.map((c) => html`<option${sel(v.city, c)}>${c}</option>`)}</select>${err(e, 'city')}</div>
  </fieldset>
  <fieldset>
    <legend>3 · Açıklama</legend>
    <div class="f"><label for="title">Başlık <span class="muted">(boş bırakırsanız otomatik oluşturulur)</span></label><input id="title" name="title" maxlength="80" value="${v.title ?? ''}"></div>
    <div class="f"><label for="description">Açıklama</label><textarea id="description" name="description" rows="5" maxlength="2000" required${invalid(e, 'description')}>${v.description ?? ''}</textarea>${err(e, 'description')}
      <p class="muted small">Yaş/boy, beslenme, suyun sertliği, sağlık durumu ve teslim şekli gibi bilgileri yazın.</p></div>
  </fieldset>
  <fieldset>
    <legend>4 · İletişim <span class="muted">(isteğe bağlı)</span></legend>
    <p class="muted small">Sitede mesajlaşma yoktur; alıcılar yalnızca burada yazdığınız numaralardan ulaşır. Numaralar ilan sayfasında herkese açık görünür ve hesabınıza kaydedilir.</p>
    <div class="row2">
      <div class="f"><label for="whatsapp">WhatsApp numarası</label><input id="whatsapp" name="whatsapp" type="tel" autocomplete="tel" placeholder="05xx xxx xx xx" value="${v.whatsapp ?? local(ctx.user?.whatsapp)}"${invalid(e, 'whatsapp')}>${err(e, 'whatsapp')}</div>
      <div class="f"><label for="phone">Telefon</label><input id="phone" name="phone" type="tel" placeholder="05xx xxx xx xx" value="${v.phone ?? local(ctx.user?.phone)}"${invalid(e, 'phone')}>${err(e, 'phone')}</div>
    </div>
  </fieldset>
  <button class="btn btn-big" type="submit">İlanı yayınla</button>
  </div>
  <aside class="lf-preview" aria-labelledby="onizleme-b">
    <div class="sticky">
      <h2 id="onizleme-b">Temsili 3B önizleme</h2>
      <div class="stage" id="sahne">
        <canvas id="cv" tabindex="0" role="img" aria-label="Seçtiğiniz tür, şekil ve renk için temsili 3B önizleme"></canvas>
        <div class="hot" id="ov" hidden></div>
        <p class="stage-status" id="durum" role="status">Tür seçtiğinizde 3B önizleme burada görünür.</p>
        <p class="stage-fallback" id="yedek" hidden>Bu tarayıcıda 3B önizleme açılamadı (WebGL yok). İlanı yine de verebilirsiniz.</p>
      </div>
      <p class="muted small" id="onizleme-ozet" aria-live="polite"></p>
      <p class="note small">Önizleme temsilidir; alıcılar ilanınızda sizin gerçek fotoğraflarınızı görür.</p>
    </div>
  </aside>
</form>`;
  return layout(ctx, { title: 'İlan ver', body, path: '/ilan/yeni', entry: 'ilanForm' });
}

// ---------- giriş / kayıt ----------
export function loginPage(ctx: PageCtx, o: { email?: string; error?: string; next?: string }): string {
  const body = html`<section class="auth"><h1>Giriş yap</h1>
${o.error ? html`<p class="flash flash-err" role="alert">${o.error}</p>` : ''}
<form method="post" action="/giris" class="stack" novalidate>${csrfField(ctx)}<input type="hidden" name="next" value="${o.next ?? ''}">
  <label for="email">E-posta</label><input id="email" name="email" type="email" autocomplete="email" required value="${o.email ?? ''}">
  <label for="password">Parola</label><input id="password" name="password" type="password" autocomplete="current-password" required>
  <button class="btn" type="submit">Giriş yap</button></form>
<p>Hesabınız yok mu? <a href="/kayit">Kayıt olun</a>.</p></section>`;
  return layout(ctx, { title: 'Giriş', body, path: '/giris', main: 'wrap narrow' });
}
export function registerPage(ctx: PageCtx, o: { values: { email?: string; displayName?: string }; errors: Errors }): string {
  const e = o.errors;
  const body = html`<section class="auth"><h1>Kayıt ol</h1>
<p class="muted">Yalnızca e-posta, görünen ad ve parola yeterli. Parolanız tek yönlü (scrypt) özetle saklanır.</p>
<form method="post" action="/kayit" class="stack" novalidate>${csrfField(ctx)}
  <label for="displayName">Görünen ad</label><input id="displayName" name="displayName" autocomplete="nickname" maxlength="40" required value="${o.values.displayName ?? ''}"${invalid(e, 'displayName')}>${err(e, 'displayName')}
  <label for="email">E-posta</label><input id="email" name="email" type="email" autocomplete="email" required value="${o.values.email ?? ''}"${invalid(e, 'email')}>${err(e, 'email')}
  <label for="password">Parola (en az 8 karakter)</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required${invalid(e, 'password')}>${err(e, 'password')}
  <label for="password2">Parola (tekrar)</label><input id="password2" name="password2" type="password" autocomplete="new-password" required${invalid(e, 'password2')}>${err(e, 'password2')}
  ${err(e, 'form')}
  <button class="btn" type="submit">Hesap oluştur</button></form>
<p>Zaten hesabınız var mı? <a href="/giris">Giriş yapın</a>.</p></section>`;
  return layout(ctx, { title: 'Kayıt', body, path: '/kayit', main: 'wrap narrow' });
}

// ---------- satıcı (yer tutucu) ----------
export function sellerPage(ctx: PageCtx, o: { seller: { id: number; display_name: string; created_at: number }; items: Listing[] }): string {
  const body = html`<h1>${o.seller.display_name}</h1>
<p class="muted">Üyelik: ${fmtDate(o.seller.created_at)} · ${o.items.length} aktif ilan</p>
<aside class="soon" aria-label="Yakında"><strong>Akvaryum yakında.</strong> Satıcıların kendi akvaryumlarını çok balıklı 3B sahnede gösterebileceği bölüm sonraki aşamada eklenecek. Şimdilik yalnızca ilanlar listelenir.</aside>
<h2>İlanlar</h2>
${o.items.length ? cardGrid(o.items) : html`<p class="empty">Bu satıcının aktif ilanı yok.</p>`}`;
  return layout(ctx, { title: o.seller.display_name, body, path: '/satici/' + o.seller.id });
}

// ---------- yönetim ----------
export function adminReportsPage(ctx: PageCtx, rows: ReportRow[]): string {
  const body = html`<h1>Şikayetler</h1><p class="muted">${rows.length} kayıt. Şikayet edilen ilanlar "inceleme bekliyor" olarak işaretlenir; bu sayfa yalnızca listeler.</p>
${rows.length ? html`<div class="table-wrap"><table><thead><tr><th>Tarih</th><th>İlan</th><th>Neden</th><th>Not</th><th>Bildiren</th></tr></thead><tbody>
${rows.map((r) => html`<tr><td>${new Date(r.created_at).toLocaleString('tr-TR')}</td><td><a href="/ilan/${r.listing_id}">#${r.listing_id} ${r.listing_title}</a>${r.listing_status === 'removed' ? ' (kaldırıldı)' : ''}</td><td>${REPORT_REASONS.find((x) => x.id === r.reason)?.ad ?? r.reason}</td><td>${r.note}</td><td>${r.reporter_email ?? '—'}</td></tr>`)}
</tbody></table></div>` : html`<p class="empty">Şikayet yok.</p>`}`;
  return layout(ctx, { title: 'Şikayetler', body, path: '/admin/raporlar' });
}

export function messagePage(ctx: PageCtx, title: string, text: string): string {
  return layout(ctx, { title, body: html`<section class="auth"><h1>${title}</h1><p>${text}</p><p><a class="btn" href="/">Ana sayfa</a></p></section>`, main: 'wrap narrow' });
}
void esc;
