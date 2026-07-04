import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ── Converti impostazioni JS (camelCase) ↔ DB (snake_case) ── */
export const settingsToDb = s => ({
  id: 1,
  ragione_sociale:  s.ragioneSociale   || '',
  partita_iva:      s.partitaIva       || '',
  codice_fiscale:   s.codiceFiscale    || '',
  indirizzo:        s.indirizzo        || '',
  cap:              s.cap              || '',
  citta:            s.citta            || '',
  provincia:        s.provincia        || '',
  telefono:         s.telefono         || '',
  email:            s.email            || '',
  pec:              s.pec              || '',
  regime_fiscale:   s.regimeFiscale    || 'margine',
  liquidazione_iva: s.liquidazioneIva  || 'trimestrale',
  iban:             s.iban             || '',
  updated_at:       new Date().toISOString(),
});

export const settingsFromDb = r => ({
  ragioneSociale:   r.ragione_sociale  || '',
  partitaIva:       r.partita_iva      || '',
  codiceFiscale:    r.codice_fiscale   || '',
  indirizzo:        r.indirizzo        || '',
  cap:              r.cap              || '',
  citta:            r.citta            || '',
  provincia:        r.provincia        || '',
  telefono:         r.telefono         || '',
  email:            r.email            || '',
  pec:              r.pec              || '',
  regimeFiscale:    r.regime_fiscale   || 'margine',
  liquidazioneIva:  r.liquidazione_iva || 'trimestrale',
  iban:             r.iban             || '',
  codiceAteco:      '45.11.01',
  banca:            '',
  tipoSocieta:      'srl',
  aliquotaImposta:  24,
});
