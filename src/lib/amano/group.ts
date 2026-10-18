import { createShrimpGroup } from '../karides/group';
import type { FishGroup, FishGroupOptions } from '../akvaryum/types';
import { AMANO_PROFILE } from './profile';

export const createAmanoGroup = (opts: FishGroupOptions): FishGroup => createShrimpGroup('amano', AMANO_PROFILE, opts);
