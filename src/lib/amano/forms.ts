// Amano karidesinde tanınan bir şekil (form) varyetesi yoktur: dürüstçe tek biçim.
export interface Form { id: string; ad: string; aciklama: string; grup?: string; dogrulanmali?: boolean }

export const FORMS: Form[] = [
  { id: 'standart', ad: 'Standart (tek biçim)', grup: 'Doğal biçim',
    aciklama: 'Amano karidesi için akvaryum ticaretinde tanınan uzun uzantılı ya da başka bir şekil (form) varyetesi bulunmadığından yalnızca doğal gövde biçimi vardır; seçim yapılamaz (kaynakla doğrulanmalı).' },
];
