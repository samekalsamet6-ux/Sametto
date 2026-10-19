import { html, raw, esc, type SafeHtml } from './html.ts';
import { layout, csrfField, SITE_NAME, type PageCtx } from './layout.ts';
import { CATALOG, OTHER_ID, speciesById, speciesLabel, sexOptions, fishSexOptions, noSexSplit, itemLabel, UNKNOWN_SEX, type CatItem } from '../../shared/catalog.ts';
import { CITIES } from '../../shared/cities.ts';
import { unitPriceText, UNIT_NOTE, relativeDay, absoluteDate } from '../../shared/listing-format.ts';
import { filterChips, narrowOptions } from '../../shared/filters.ts';
import { formatPrice, formatPhone, formatPhoneLocal, REPORT_REASONS, MAX_FISH, MAX_KARIDES, MAX_HEAVY, type Errors } from '../validation.ts';
import { PAGE_SIZE, SORTS, type SearchParams } from '../search.ts';
import type { Listing, Photo, ReportRow, AquariumFish } from '../db.ts';

const fmtDate = absoluteDate;
const itemName = (list: CatItem[], id: string | null) => { const x = list.find((y) => y.id === id); return x ? itemLabel(x) : null; };

export function sexLabel(speciesId: string, sex: string): string {
  if (noSexSplit(speciesId) && (sex === UNKNOWN_SEX || sex === 'disi')) return 'Ayrım yok';
  if (sex === UNKNOWN_SEX) return 'Cinsiyet bilinmiyor / karışık';
  return sexOptions(speciesId).find((s) => s.id === sex)?.ad ?? sex;
}
const KB_HELP = 'Klavye: 3B görünüm odaktayken ok tuşları döndürür, + ve - yakınlaştırır, Home sıfırlar.';
/** Modelin tür kimliğinin şematik/belirsiz olduğu türler için ilan sayfasında ayrıca yazılan cümle. */
const IDENTITY_NOTE: Record<string, string> = {
  corydoras: 'Bu modelin tür kimliği şematiktir ve belirsizdir: genel bir Corydoras gövdesi (C. aeneus / C. paleatus tipi) varsayılmıştır.',
  vatoz: 'Bu modelin tür kimliği şematiktir ve belirsizdir: belirli bir türün değil, genel Potamotrygon benzeri bir diskin temsilidir.',
};
export function listingFacts(l: Listing): { species: string; form: string | null; variant: string | null; sex: string } {
  const sp = speciesById(l.species_id);
  return { species: speciesLabel(l.species_id, l.species_other), form: sp ? itemName(sp.forms, l.form_id) : null, variant: sp ? itemName(sp.variants, l.variant_id) : null, sex: sexLabel(l.species_id, l.sex) };
}

const local = (n?: string | null) => (n ? formatPhoneLocal(n) : '');
const err = (errors: Errors, k: string) => (errors[k] ? html`<p class="field-err" id="${k}-err">${errors[k]}</p>` : '');
const invalid = (errors: Errors, k: string) => (errors[k] ? raw(` aria-invalid="true" aria-describedby="${k}-err"`) : '');

// ---------- ilan kartı ----------
/** Kartta kısa adlar; şekil/renk adı kaynaklarda tutarsızsa uzun uyarı yerine küçük rozet (uzun açıklama ilan sayfasında). */
export function listingShortFacts(l: Listing): { species: string; form: string | null; variant: string | null; unverified: boolean } {
  const sp = speciesById(l.species_id);
  const form = sp?.forms.find((y) => y.id === l.form_id), variant = sp?.variants.find((y) => y.id === l.variant_id);
  return { species: speciesLabel(l.species_id, l.species_other), form: form?.ad ?? null, variant: variant?.ad ?? null, unverified: !!(form?.dogrulanmali || variant?.dogrulanmali) };
}
const UNVERIFIED_BADGE = 'Şekil ya da renk adı kaynaklarda tutarsız; satıcıyla doğrulayın. Ayrıntı ilan sayfasındadır.';
const dateTag = (ms: number, now: number) => html`<time datetime="${new Date(ms).toISOString()}" title="İlan tarihi: ${absoluteDate(ms)}">${relativeDay(ms, now)}</time>`;
export function listingCard(l: Listing, now: number = Date.now()): SafeHtml {
  const f = listingShortFacts(l);
  const demo = l.is_demo ? html`<span class="tag tag-demo">Örnek ilan</span>` : '';
  const unit = unitPriceText(l.price_kurus, l.quantity);
  return html`<li class="card">
  <a class="card-link" href="/ilan/${l.id}">
    <span class="card-photo">${l.first_photo ? html`<img src="/yuklemeler/${l.first_photo}" alt="${f.species} ilanının satıcı fotoğrafı" loading="lazy" decoding="async" width="400" height="300">` : html`<span class="photo-none">Fotoğraf yok</span>`}${demo}</span>
    <span class="card-body">
      <span class="card-title">${l.title}</span>
      <span class="card-meta">${[f.species, f.form, f.variant].filter(Boolean).join(' · ')}${f.unverified ? html` <span class="badge-verify" title="${UNVERIFIED_BADGE}">doğrulanmalı<span class="sr-only"> (${UNVERIFIED_BADGE})</span></span>` : ''}</span>
      <span class="card-price"><strong class="price">${formatPrice(l.price_kurus)}</strong>${unit ? html`<span class="price-total">toplam</span>` : ''}</span>
      ${unit ? html`<span class="card-unit" title="Tanesi ${unit}: ${UNIT_NOTE}">tanesi ≈ ${unit}<span class="sr-only"> (${UNIT_NOTE})</span></span>` : ''}
      <span class="card-row"><span class="card-loc muted">${l.quantity} adet · ${locationLabel(l)}</span><span class="card-date muted">${dateTag(l.created_at, now)}</span></span>
    </span>
  </a>
</li>`;
}
const cardGrid = (items: Listing[]) => { const now = Date.now(); return html`<ul class="grid" role="list">${items.map((l) => listingCard(l, now))}</ul>`; };

// ---------- ana sayfa ----------
export function homePage(ctx: PageCtx, latest: Listing[]): string {
  const body = html`
<section class="home-search" aria-labelledby="ara-b">
  <h1 id="ara-b">Akvaryum balığı ilanları</h1>
  <form class="search-box" method="get" action="/ilanlar" role="search" aria-label="İlan ara">
    <div class="f"><label for="h-tur">Tür</label><select id="h-tur" name="tur"><option value="">Tüm türler</option>${CATALOG.map((s) => html`<option value="${s.id}">${s.ad}</option>`)}<option value="${OTHER_ID}">Diğer türler</option></select></div>
    <div class="f"><label for="h-sehir">Şehir</label><select id="h-sehir" name="sehir"><option value="">Tüm şehirler</option>${CITIES.map((c) => html`<option>${c}</option>`)}</select></div>
    <button class="btn" type="submit">Ara</button>
  </form>
  <p class="search-links"><a href="/ilanlar">Tüm filtreler</a> <span aria-hidden="true">·</span> <a class="btn btn-small" href="/ilan/yeni">İlan ver</a></p>
</section>

<section aria-labelledby="turler-b">
  <h2 id="turler-b">Türler</h2>
  <ul class="chips" role="list">${CATALOG.map((s) => html`<li><a class="chip" href="/ilanlar?tur=${s.id}">${s.ad}</a></li>`)}<li><a class="chip chip-quiet" href="/ilanlar?tur=${OTHER_ID}">Diğer türler</a></li></ul>
</section>

<section aria-labelledby="son-b">
  <div class="section-head"><h2 id="son-b">Son ilanlar</h2><a href="/ilanlar">Tümünü gör</a></div>
  ${latest.length ? cardGrid(latest) : html`<p class="empty">Henüz ilan yok. İlk ilanı siz verin.</p>`}
</section>`;
  return layout(ctx, { title: 'Balık ilanları', body, path: '/', entry: 'site' });
}

/** "İlçe, Şehir"; ilçesi olmayan eski ilanlarda yalnızca şehir. */
export const locationLabel = (l: { city: string; district?: string | null }): string => (l.district ? `${l.district}, ${l.city}` : l.city);

// ---------- ilan listesi / arama ----------
export function listingsPage(ctx: PageCtx, o: { params: SearchParams; result: { items: Listing[]; total: number; page: number; pages: number } }): string {
  const p = o.params, r = o.result;
  const qs = (extra: Record<string, string | number>) => {
    const u = new URLSearchParams();
    const base: Record<string, string | undefined> = { tur: p.species, sekil: p.form, renk: p.variant, sehir: p.city, ilce: p.district, min: p.minPrice, max: p.maxPrice, sirala: p.sort };
    for (const [k, v] of Object.entries({ ...base, ...extra })) if (v !== undefined && v !== '') u.set(k, String(v));
    return u.toString();
  };
  const sp = p.species ? speciesById(p.species) : undefined;
  const selectedForm = p.form ?? '', selectedVar = p.variant ?? '';
  const { forms: formOptions, variants: varOptions } = narrowOptions(p.species ?? '');
  const chips = filterChips(p);
  const qsOnly = (drop: string[]) => { const u = new URLSearchParams(qs({})); for (const k of drop) u.delete(k); const t = u.toString(); return t ? '?' + t : ''; };
  const body = html`
<h1>İlanlar</h1>
<details class="filter-panel" id="filtre-panel" open>
<summary class="filter-toggle"><span>Filtrele</span>${chips.length ? html`<span class="count-badge">${chips.length}<span class="sr-only"> filtre seçili</span></span>` : ''}</summary>
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
  <div class="f">
    <label for="f-ilce">İlçe</label>
    <input id="f-ilce" name="ilce" maxlength="60" placeholder="örn. Kadıköy" value="${p.district ?? ''}">
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
</details>
<p class="result-count" role="status" aria-live="polite" data-testid="sonuc-sayisi">${r.total} ilan bulundu</p>
${chips.length ? html`<ul class="chips filter-chips" role="list" aria-label="Seçili filtreler">${chips.map((c) => html`<li><a class="chip chip-x" href="/ilanlar${qsOnly(c.drop)}">${c.label} <span aria-hidden="true">×</span><span class="sr-only"> filtresini kaldır</span></a></li>`)}<li><a class="chip chip-quiet" href="/ilanlar">Tümünü temizle</a></li></ul>` : ''}
<p class="muted small">Liste görünümünde yalnızca satıcının gerçek fotoğrafı gösterilir; 3B model ilan sayfasındadır.</p>
${r.items.length ? cardGrid(r.items) : html`<p class="empty">Bu ölçütlere uyan ilan bulunamadı. Filtreleri gevşetmeyi deneyin ya da <a href="/ilanlar">tüm ilanlara bakın</a>.</p>`}
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
  const unit = unitPriceText(l.price_kurus, l.quantity);
  const facts: [string, string][] = [['Tür', f.species]];
  if (f.form) facts.push(['Şekil', f.form]);
  if (f.variant) facts.push(['Renk', f.variant]);
  facts.push(['Cinsiyet', f.sex], ['Adet', String(l.quantity)], ['Konum', locationLabel(l)], ['İlan tarihi', `${fmtDate(l.created_at)} (${relativeDay(l.created_at, Date.now())})`]);
  const canReport = !o.alreadyReported && !isOwner;
  const reportInner = html`${o.reported ? html`<p class="flash flash-ok" role="status">Şikayetiniz alındı. İlan incelenmek üzere işaretlendi, teşekkürler.</p>` : ''}${o.alreadyReported && !o.reported ? html`<p class="muted">Bu ilanı daha önce şikayet ettiniz.</p>` : ''}${canReport
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
      : ''}`;
  // Boş kutu oluşmasın: içerik yoksa bölüm hiç çizilmez.
  const reportBlock = reportInner.value.trim() ? html`<section class="report" aria-label="Şikayet">${reportInner}</section>` : '';
  const body = html`
<nav class="crumbs" aria-label="Sayfa yolu"><a href="/ilanlar">İlanlar</a> <span aria-hidden="true">/</span> <a href="/ilanlar?tur=${l.species_id}">${f.species}</a></nav>
<article class="detail" data-listing="${l.id}">
  <header class="detail-head">
    <h1>${l.title}</h1>
    <p class="detail-price"><strong class="price">${formatPrice(l.price_kurus)}</strong> ${l.quantity > 1 ? html`<span class="muted">(toplam, ${l.quantity} adet için satıcının beyanı)</span>` : ''}</p>
    ${unit ? html`<p class="detail-unit" data-testid="adet-basi"><strong>tanesi ≈ ${unit}</strong> <span class="muted">(${UNIT_NOTE})</span></p>` : ''}
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
      <p class="small" id="m3d-secim" data-testid="secim-3b">Seçilen: ${[f.species, f.form, f.variant, f.sex].filter(Boolean).join(' · ')}.</p>
      <p class="small">Gerçek balık bu görünümle birebir aynı olmayabilir.${IDENTITY_NOTE[l.species_id] ? ' ' + IDENTITY_NOTE[l.species_id] : ''}</p>
      <div class="stage" id="sahne" data-species="${l.species_id}" data-form="${l.form_id ?? ''}" data-variant="${l.variant_id ?? ''}" data-sex="${l.sex}">
        <canvas id="cv" tabindex="0" role="group" aria-label="${f.species} için temsili 3B model; sürükleyerek döndürebilirsiniz" aria-describedby="kb-yardim m3d-secim" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown + - Home"></canvas>
        <div class="hot" id="ov" hidden></div>
        <p class="stage-status" id="durum" role="status">3B model yükleniyor…</p>
        <div class="stage-poster" id="poster" hidden>
          <p class="poster-title">Temsili 3B görünüm</p>
          <p>Veri ve pil tasarrufu için 3B görünüm isteğe bağlıdır. Gerçek fotoğraflar ve bilgiler 3B olmadan da geçerlidir.</p>
          <button type="button" class="btn btn-light" id="ac3b" aria-controls="sahne">Temsili 3B görünümü aç</button>
        </div>
        <p class="stage-fallback" id="yedek" hidden>Bu tarayıcıda 3B görünüm açılamadı (WebGL kapalı ya da desteklenmiyor). İlanın fotoğrafları ve bilgileri yine de geçerlidir.</p>
      </div>
      <p class="muted small" id="kb-yardim">${KB_HELP}</p>
      <div class="viewbar" id="gorunum" role="group" aria-label="Bakış açısı" hidden>${sp.views.slice(0, 4).map((v) => html`<button type="button" class="btn btn-small btn-ghost" data-view="${v.id}">${v.ad}</button>`)}<button type="button" class="btn btn-small btn-ghost" id="don" aria-pressed="false">Otomatik döndür</button></div>
      <p class="note small">Model şematik bir yorumdur; gerçek balığın rengi ve yüzgeç biçimi farklı olabilir.${sp.not ? ' ' + sp.not : ''}</p>`
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
      ${isOwner ? html`<form method="post" action="/ilan/${l.id}/kaldir" data-confirm="İlan kaldırılsın mı? Fotoğrafları da silinir.">${csrfField(ctx)}<button class="btn btn-danger btn-small" type="submit">İlanı kaldır</button></form>` : ''}
    </aside>
  </div>
  ${reportBlock}
</article>`;
  return layout(ctx, { title: l.title, description: `${f.species}${f.variant ? ' · ' + f.variant : ''} — ${locationLabel(l)}, ${formatPrice(l.price_kurus)}`, body, entry: 'ilanDetay' });
}

// ---------- ilan formu ----------
export interface FormValues { species?: string; speciesOther?: string; form?: string; variant?: string; sex?: string; quantity?: string; price?: string; city?: string; district?: string; title?: string; description?: string; whatsapp?: string; phone?: string }
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
        <select id="form" name="form"${invalid(e, 'form')}>${sp ? sp.forms.map((x) => html`<option value="${x.id}"${sel(v.form, x.id)}>${itemLabel(x)}</option>`) : html`<option value="">Önce tür seçin</option>`}</select>${err(e, 'form')}</div>
      <div class="f" id="renk-kutu"><label for="variant">Renk</label>
        <select id="variant" name="variant"${invalid(e, 'variant')}>${sp ? sp.variants.map((x) => html`<option value="${x.id}"${sel(v.variant, x.id)}>${itemLabel(x)}</option>`) : html`<option value="">Önce tür seçin</option>`}</select>${err(e, 'variant')}</div>
    </div>
    <div class="row3">
      <div class="f"><label for="sex">Cinsiyet</label>
        <select id="sex" name="sex" required${invalid(e, 'sex')}>${sexOptions(v.species ?? OTHER_ID).map((x) => html`<option value="${x.id}"${sel(v.sex ?? UNKNOWN_SEX, x.id)}>${x.ad}</option>`)}</select>${err(e, 'sex')}</div>
      <div class="f"><label for="quantity">Adet</label><input id="quantity" name="quantity" type="number" min="1" max="10000" inputmode="numeric" value="${v.quantity ?? '1'}" required${invalid(e, 'quantity')}>${err(e, 'quantity')}</div>
      <div class="f"><label for="price">Fiyat (₺)</label><input id="price" name="price" inputmode="decimal" placeholder="örn. 250 ya da 249,90" value="${v.price ?? ''}" required${invalid(e, 'price')}>${err(e, 'price')}</div>
    </div>
    <div class="row2">
      <div class="f"><label for="city">Şehir</label>
        <select id="city" name="city" required${invalid(e, 'city')}><option value="">Seçin…</option>${CITIES.map((c) => html`<option${sel(v.city, c)}>${c}</option>`)}</select>${err(e, 'city')}</div>
      <div class="f"><label for="district">İlçe</label>
        <input id="district" name="district" maxlength="60" autocomplete="off" placeholder="örn. Kadıköy" value="${v.district ?? ''}" required${invalid(e, 'district')}>${err(e, 'district')}</div>
    </div>
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
      <h2 id="onizleme-b">Temsili 3B görünüm (önizleme)</h2>
      <div class="stage" id="sahne">
        <canvas id="cv" role="img" aria-label="Seçtiğiniz tür, şekil ve renk için temsili 3B önizleme"></canvas>
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
/** Betik yoksa işe yaramaz, bu yüzden gizli doğar; site.ts açar. */
const showPassword = html`<label class="check" data-show-pw hidden><input type="checkbox" aria-controls="password"> Parolayı göster</label>`;
export function loginPage(ctx: PageCtx, o: { email?: string; error?: string; next?: string }): string {
  const body = html`<section class="auth"><h1>Giriş yap</h1>
${o.error ? html`<p class="flash flash-err" role="alert">${o.error}</p>` : ''}
<form method="post" action="/giris" class="stack" novalidate>${csrfField(ctx)}<input type="hidden" name="next" value="${o.next ?? ''}">
  <label for="email">E-posta</label><input id="email" name="email" type="email" autocomplete="email" required value="${o.email ?? ''}">
  <label for="password">Parola</label><input id="password" name="password" type="password" autocomplete="current-password" required data-pw>
  ${showPassword}
  <button class="btn" type="submit">Giriş yap</button></form>
<p>Hesabınız yok mu? <a href="/kayit">Kayıt olun</a>.</p></section>`;
  return layout(ctx, { title: 'Giriş', body, path: '/giris', main: 'wrap narrow' });
}
export function registerPage(ctx: PageCtx, o: { values: { email?: string; displayName?: string }; errors: Errors }): string {
  const e = o.errors;
  // Parola tekrarı alanı kaldırıldı (sunucu yalnızca gönderilmişse karşılaştırır); bunun yerine "Parolayı göster" düğmesi var.
  const body = html`<section class="auth"><h1>Kayıt ol</h1>
<p class="muted">Yalnızca e-posta, görünen ad ve parola yeterli. Parolanız güvenli biçimde saklanır.</p>
<p class="muted">Kayıt olmadan da <a href="/ilanlar">ilanlara bakabilirsiniz</a>; hesap yalnızca ilan vermek için gerekir.</p>
<form method="post" action="/kayit" class="stack" novalidate>${csrfField(ctx)}
  <label for="displayName">Görünen ad</label><input id="displayName" name="displayName" autocomplete="nickname" maxlength="40" required value="${o.values.displayName ?? ''}"${invalid(e, 'displayName')}>${err(e, 'displayName')}
  <label for="email">E-posta</label><input id="email" name="email" type="email" autocomplete="email" required value="${o.values.email ?? ''}"${invalid(e, 'email')}>${err(e, 'email')}
  <label for="password">Parola (en az 8 karakter)</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required data-pw${invalid(e, 'password')}>${err(e, 'password')}
  ${showPassword}
  ${err(e, 'password2')}${err(e, 'form')}
  <button class="btn" type="submit">Hesap oluştur</button></form>
<p>Zaten hesabınız var mı? <a href="/giris">Giriş yapın</a>.</p></section>`;
  return layout(ctx, { title: 'Kayıt', body, path: '/kayit', main: 'wrap narrow' });
}

// ---------- satıcı profili + akvaryum ----------
export const TANK_LABEL = 'Sahne temsilidir; stok ve fiyat, satıcının aktif ilanlarından gelir';
const TANK_ARIA = 'temsili 3B görünüm';

export function fishFacts(f: AquariumFish): { species: string; form: string | null; variant: string | null; sex: string } {
  const sp = speciesById(f.species_id);
  return { species: sp?.ad ?? f.species_id, form: sp ? itemName(sp.forms, f.form_id) : null, variant: sp ? itemName(sp.variants, f.variant_id) : null, sex: (sp && fishSexOptions(sp.id).find((x) => x.id === f.sex)?.ad) ?? f.sex };
}
const fishDetail = (f: AquariumFish) => { const x = fishFacts(f); return [x.form, x.variant, x.sex].filter(Boolean).join(' · '); };

/** Balık listesi: hem 3B sahnenin veri kaynağı (data-*) hem de herkesin okuyabileceği metin. `pick`: her balık için "stok ve fiyat" düğmesi (klavye yolu). */
function fishList(fish: AquariumFish[], o: { remove?: PageCtx; id?: string; pick?: boolean } = {}): SafeHtml {
  return html`<ul class="fish-list" role="list"${o.id ? raw(` id="${o.id}"`) : ''}>${fish.map((f) => { const x = fishFacts(f); return html`<li data-species="${f.species_id}" data-form="${f.form_id ?? ''}" data-variant="${f.variant_id ?? ''}" data-sex="${f.sex}" data-ad="${x.species}" data-form-ad="${x.form ?? ''}" data-variant-ad="${x.variant ?? ''}" data-sex-ad="${x.sex}"><span class="fish-name">${x.species}</span> <span class="fish-detail">${fishDetail(f)}</span>${o.pick
      ? html`<button type="button" class="btn btn-small btn-ghost fish-pick" data-pick aria-haspopup="true" aria-label="Stok ve fiyat: ${x.species} (${fishDetail(f)})">Stok ve fiyat</button>` : ''}${o.remove
      ? html`<form method="post" action="/profil/akvaryum/${f.id}/sil" class="inline">${csrfField(o.remove)}<button class="btn btn-small btn-ghost" type="submit" aria-label="${x.species} (${fishDetail(f)}) balığını kaldır">Kaldır</button></form>` : ''}</li>`; })}</ul>`;
}

/** Profildeki balık kartı için satıcının aktif ilanları (kısa kayıt); sayfadaki ilan listesiyle aynı veri, aynı erişim. */
export function stockJson(items: Listing[]): string {
  return JSON.stringify(items.map((l) => ({ id: l.id, t: l.title, s: l.species_id, f: l.form_id ?? '', v: l.variant_id ?? '', x: l.sex, q: l.quantity, p: l.price_kurus })));
}

export function sellerPage(ctx: PageCtx, o: { seller: { id: number; display_name: string; created_at: number; is_demo?: number }; items: Listing[]; fish: AquariumFish[]; isOwner?: boolean }): string {
  const name = o.seller.display_name;
  const fishSorted = [...o.fish].sort((a, b) => (a.species_id < b.species_id ? -1 : a.species_id > b.species_id ? 1 : a.id - b.id)); // listede türe göre gruplu
  const tank = o.fish.length
    ? html`<p class="label3d" data-testid="etiket-akvaryum">${TANK_LABEL}</p>
  <div class="tank-wrap">
  <div class="stage tank" id="tank" data-count="${o.fish.length}" data-stock="${stockJson(o.items)}">
    <canvas id="tank-cv" tabindex="0" role="group" aria-label="${name} adlı satıcının akvaryumu: ${o.fish.length} balık, ${TANK_ARIA}. Bir balığa dokunun ya da tıklayın: stok ve fiyat" aria-describedby="tank-kb-yardim akv-liste-b" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown + - Home"></canvas>
    <p class="stage-status" id="tank-durum" role="status" hidden></p>
    <div class="stage-poster" id="tank-poster" hidden>
      <p class="poster-title">Temsili 3B akvaryum</p>
      <p>Veri ve pil tasarrufu için 3B sahne isteğe bağlıdır. Balık listesi ve stok/fiyat kartı 3B olmadan da çalışır.</p>
      <button type="button" class="btn btn-light" id="tank-ac" aria-controls="tank">Akvaryumu aç</button>
    </div>
    <p class="stage-fallback" id="tank-yedek" hidden>3B akvaryum bu tarayıcıda açılamadı (WebGL kapalı ya da desteklenmiyor). Balıkların listesi ve stok bilgisi aşağıdadır.</p>
  </div>
    <section class="fish-card" id="balik-karti" aria-labelledby="balik-karti-b" tabindex="-1" hidden>
      <div class="fish-card-head"><h3 id="balik-karti-b"></h3><button type="button" class="btn btn-small btn-ghost" id="balik-karti-kapat" aria-label="Balık kartını kapat">Kapat</button></div>
      <dl class="fish-card-facts" id="balik-karti-bilgi"></dl>
      <div id="balik-karti-stok" aria-live="polite"></div>
      <p class="fish-card-note">Bu bilgi satıcının aktif ilanlarına dayanır; sahne temsilidir.</p>
    </section>
  </div>
  <div class="tank-bar">
    <p class="muted small" id="tank-ipucu" hidden>Bir balığa dokunun: stok ve fiyat. Sürükleyerek döndürün, iki parmakla ya da +/− ile yakınlaştırın.</p>
    <div class="viewbar" id="tank-bar" role="group" aria-label="Akvaryum görünümünü ayarla" hidden>
      <button type="button" class="btn btn-small btn-ghost" data-act="left" aria-label="Sola döndür">&#8592;</button>
      <button type="button" class="btn btn-small btn-ghost" data-act="right" aria-label="Sağa döndür">&#8594;</button>
      <button type="button" class="btn btn-small btn-ghost" data-act="in" aria-label="Yakınlaştır">+</button>
      <button type="button" class="btn btn-small btn-ghost" data-act="out" aria-label="Uzaklaştır">&#8722;</button>
      <button type="button" class="btn btn-small btn-ghost" data-act="reset">Sıfırla</button>
    </div>
  </div>
  <p class="muted small" id="tank-kb-yardim">Klavye: 3B akvaryum odaktayken ok tuşları döndürür, + ve - yakınlaştırır, Home sıfırlar. Her balığın stok ve fiyatı aşağıdaki listeden de açılır.</p>
  <h3 id="akv-liste-b">Akvaryumdaki balıklar (${o.fish.length})</h3>
  ${fishList(fishSorted, { id: 'akv-liste', pick: true })}
  <p class="note small">${o.seller.is_demo ? 'Bu hesap bir demo hesabıdır; akvaryum örnek amaçlıdır. ' : ''}Balıklar satıcının seçtiği tür, şekil, renk ve cinsiyetle çizilir; gerçek fotoğraf yerine geçmez. Kart, aynı balık için satıcının aktif ilanlarını gösterir; ayrıntılar için ilana bakın.</p>`
    : html`<p class="empty" data-testid="akv-bos">Bu satıcı henüz akvaryum oluşturmadı</p>`;
  const body = html`<h1>${name}</h1>
<p class="muted">Üyelik: ${fmtDate(o.seller.created_at)} · ${o.items.length} aktif ilan</p>
<section class="akv" id="akvaryum" aria-labelledby="akv-b" data-testid="akvaryum">
  <div class="akv-head"><h2 id="akv-b">Akvaryum</h2>${o.fish.length ? html`<span class="akv-count">${o.fish.length} balık</span>` : ''}${o.seller.is_demo && o.fish.length ? html`<span class="tag tag-demo">Örnek akvaryum</span>` : ''}${o.isOwner ? html`<a class="btn btn-small" href="/profil/akvaryum">${o.fish.length ? 'Akvaryumu düzenle' : 'Akvaryum oluştur'}</a>` : ''}</div>
  ${tank}
</section>
<h2>İlanlar</h2>
${o.items.length ? cardGrid(o.items) : html`<p class="empty">Bu satıcının aktif ilanı yok.</p>`}`;
  return layout(ctx, { title: name, description: `${name} — satıcı profili${o.fish.length ? ' ve temsili 3B akvaryum' : ''}`, body, path: '/satici/' + o.seller.id, entry: o.fish.length ? 'satici' : undefined });
}

export function aquariumEditorPage(ctx: PageCtx, o: { fish: AquariumFish[]; values: { species?: string; form?: string; variant?: string; sex?: string }; errors: Errors }): string {
  const v = o.values, e = o.errors, uid = ctx.user!.id;
  const sp = v.species ? speciesById(v.species) : undefined;
  const sel = (cur: string | undefined, val: string) => (cur === val ? raw(' selected') : '');
  const full = o.fish.length >= MAX_FISH;
  const body = html`
<nav class="crumbs" aria-label="Sayfa yolu"><a href="/satici/${uid}#akvaryum">Profilim</a> <span aria-hidden="true">/</span> Akvaryum</nav>
<h1>Akvaryumum</h1>
<p class="lead small">Profilinizde ziyaretçilerin döndürüp inceleyebileceği temsili bir akvaryum oluşturun: tür, şekil, renk ve cinsiyeti kataloğdan seçin. Sahne satıcının gerçek stoğu değildir ve ilan yerine geçmez.</p>
<p class="muted small">En çok ${MAX_FISH} balık; en çok ${MAX_KARIDES} karides; japon, pleco ve vatoz toplamda en çok ${MAX_HEAVY} (3B çizim yükü için).</p>
${Object.keys(e).length ? html`<div class="flash flash-err" role="alert" tabindex="-1" id="hata-ozeti"><strong>Balık eklenemedi.</strong><ul>${Object.entries(e).map(([k, m]) => html`<li>${k === 'form' || k === 'variant' || k === 'sex' || k === 'species' ? html`<a href="#${k === 'species' ? 'tur' : k}">${m}</a>` : m}</li>`)}</ul></div>` : ''}
<div class="listing-form akv-edit">
  <div class="lf-main">
    <form method="post" action="/profil/akvaryum/ekle" novalidate id="balik-formu">
      ${csrfField(ctx)}
      <fieldset>
        <legend>Balık ekle</legend>
        <noscript><p class="muted small">Şekil ve renk listelerinin dolması için JavaScript gerekir.</p></noscript>
        <div class="f"><label for="tur">Tür</label>
          <select id="tur" name="species" required${invalid(e, 'species')}><option value="">Seçin…</option>
            ${CATALOG.map((s) => html`<option value="${s.id}"${sel(v.species, s.id)}>${s.ad}</option>`)}</select>${err(e, 'species')}</div>
        <div class="row2">
          <div class="f" id="sekil-kutu"${sp && !sp.forms.length ? raw(' hidden') : ''}><label for="form">Şekil (yüzgeç / vücut biçimi)</label>
            <select id="form" name="form"${invalid(e, 'form')}>${sp ? sp.forms.map((x) => html`<option value="${x.id}"${sel(v.form, x.id)}>${itemLabel(x)}</option>`) : html`<option value="">Önce tür seçin</option>`}</select>${err(e, 'form')}</div>
          <div class="f" id="renk-kutu"${sp && !sp.variants.length ? raw(' hidden') : ''}><label for="variant">Renk</label>
            <select id="variant" name="variant"${invalid(e, 'variant')}>${sp ? sp.variants.map((x) => html`<option value="${x.id}"${sel(v.variant, x.id)}>${itemLabel(x)}</option>`) : html`<option value="">Önce tür seçin</option>`}</select>${err(e, 'variant')}</div>
        </div>
        <div class="f"><label for="sex">Cinsiyet</label>
          <select id="sex" name="sex" required${invalid(e, 'sex')}>${sp ? fishSexOptions(sp.id).map((x) => html`<option value="${x.id}"${sel(v.sex, x.id)}>${x.ad}</option>`) : html`<option value="">Önce tür seçin</option>`}</select>${err(e, 'sex')}</div>
        <button class="btn" type="submit"${full ? raw(' disabled aria-describedby="dolu"') : ''}>Akvaryuma ekle</button>
        ${full ? html`<p class="field-err" id="dolu">Akvaryum dolu (${MAX_FISH} / ${MAX_FISH}). Yeni balık için birini kaldırın.</p>` : ''}
      </fieldset>
    </form>
    <section aria-labelledby="mevcut-b">
      <h2 id="mevcut-b">Akvaryumdaki balıklar (${o.fish.length} / ${MAX_FISH})</h2>
      ${o.fish.length ? fishList(o.fish, { remove: ctx, id: 'duzenle-liste' }) : html`<p class="empty">Henüz balık eklemediniz.</p>`}
      <p><a class="btn btn-ghost" href="/satici/${uid}#akvaryum">Herkese açık profilimde gör</a></p>
    </section>
  </div>
  <aside class="lf-preview" aria-labelledby="onizleme-b">
    <div class="sticky">
      <h2 id="onizleme-b">Seçtiğiniz balığın önizlemesi</h2>
      <div class="stage" id="sahne">
        <canvas id="cv" role="img" aria-label="Seçtiğiniz tür, şekil, renk ve cinsiyet için temsili 3B önizleme"></canvas>
        <div class="hot" id="ov" hidden></div>
        <p class="stage-status" id="durum" role="status">Tür seçtiğinizde 3B önizleme burada görünür.</p>
        <p class="stage-fallback" id="yedek" hidden>Bu tarayıcıda 3B önizleme açılamadı (WebGL yok). Balığı yine de ekleyebilirsiniz.</p>
      </div>
      <p class="muted small" id="onizleme-ozet" aria-live="polite"></p>
    </div>
  </aside>
</div>`;
  return layout(ctx, { title: 'Akvaryumum', body, path: '/profil/akvaryum', entry: 'akvaryumDuzenle' });
}

// ---------- yönetim ----------
export function adminReportsPage(ctx: PageCtx, rows: ReportRow[], flash?: string): string {
  const open = rows.filter((r) => !r.resolved_at).length;
  const body = html`<h1>Şikayetler</h1>${flash ? html`<p class="flash flash-ok" role="status">${flash}</p>` : ''}<p class="muted">${rows.length} kayıt, ${open} tanesi inceleme bekliyor. Bir ilanı kaldırdığınızda fotoğrafları silinir ve o ilanın şikayetleri "çözüldü" olarak işaretlenir.</p>
${rows.length ? html`<div class="table-wrap"><table><thead><tr><th>Tarih</th><th>İlan</th><th>Neden</th><th>Not</th><th>Bildiren</th><th>Durum</th></tr></thead><tbody>
${rows.map((r) => html`<tr><td>${new Date(r.created_at).toLocaleString('tr-TR')}</td><td>${r.listing_status === 'removed' ? html`#${r.listing_id} ${r.listing_title}` : html`<a href="/ilan/${r.listing_id}">#${r.listing_id} ${r.listing_title}</a>`}</td><td>${REPORT_REASONS.find((x) => x.id === r.reason)?.ad ?? r.reason}</td><td>${r.note}</td><td>${r.reporter_email ?? '—'}</td><td>${r.resolved_at ? html`Çözüldü: ilan kaldırıldı` : r.listing_status === 'removed' ? 'İlan kaldırıldı' : html`İnceleme bekliyor
<form method="post" action="/admin/ilan/${r.listing_id}/kaldir" data-confirm="İlan kaldırılsın mı? Fotoğrafları da silinir.">${csrfField(ctx)}<button class="btn btn-danger btn-small" type="submit">İlanı kaldır</button></form>`}</td></tr>`)}
</tbody></table></div>` : html`<p class="empty">Şikayet yok.</p>`}`;
  return layout(ctx, { title: 'Şikayetler', body, path: '/admin/raporlar' });
}

export function messagePage(ctx: PageCtx, title: string, text: string): string {
  return layout(ctx, { title, body: html`<section class="auth"><h1>${title}</h1><p>${text}</p><p><a class="btn" href="/">Ana sayfa</a></p></section>`, main: 'wrap' });
}
void esc;
