// Amano karidesi görüntüleyicisi: karides hattının ortak görüntüleyicisini Amano profiliyle çalıştırır (three.js, tembel yüklenir).
import { createViewer as baseCreate, type Viewer, type ViewerOptions } from '../karides/viewer';
import { AMANO_PROFILE } from './profile';

export type { Viewer };
export const createViewer = (o: Omit<ViewerOptions, 'profile'>): Viewer => baseCreate({ ...o, profile: AMANO_PROFILE });
