import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LANGUAGES, MESSAGES, normalizeLanguage, languageFromPreferences, directionFor, message, hasMessage } from '../web/i18n.js';

test('every supported locale has the entire catalog with nonempty safe translations',()=>{
  assert.equal(LANGUAGES.length,16);
  const keys=Object.keys(MESSAGES.en).sort();
  for(const {code}of LANGUAGES){
    assert.deepEqual(Object.keys(MESSAGES[code]).sort(),keys,`${code}: missing or extra translation`);
    for(const [key,value]of Object.entries(MESSAGES[code])){
      assert.equal(typeof value,'string',`${code}.${key}`);assert(value.trim(),`${code}.${key} empty`);
      const tags=value.match(/<[^>]*>/g)||[];
      if(tags.length){assert(['headline','introBottom','howTitle'].includes(key),`${code}.${key} unexpected markup`);assert(tags.every(tag=>['<br>','<span>','</span>'].includes(tag)),`${code}.${key} unsafe markup`);assert.equal(tags.filter(x=>x==='<span>').length,tags.filter(x=>x==='</span>').length);}
    }
    assert(message(code,'languageLabel'));assert.equal(message(code,'appTitle').includes('Threefold'),true);
  }
  assert.equal(new Set(LANGUAGES.map(x=>x.code)).size,16);
});
test('browser language matching supports regions, Filipino alias and ordered fallbacks',()=>{
  for(const [raw,expected]of [['pl-PL','pl'],['en-GB','en'],['fil-PH','tl'],['tl-PH','tl'],['pt-BR','pt'],['pt-PT','pt'],['zh-Hans-CN','zh-CN'],['zh_TW','zh-CN'],['AR-eg','ar'],['bn-BD','bn']])assert.equal(normalizeLanguage(raw),expected);
  assert.equal(languageFromPreferences(['xx','fil-PH','en-US']),'tl');
  assert.equal(languageFromPreferences(['zz','hi-IN']),'hi');
  assert.equal(languageFromPreferences(['unknown']),'en');
  for(const invalid of [null,undefined,123,{},'__proto__'])assert.equal(normalizeLanguage(invalid),null);
});
test('Arabic direction, fallbacks and API error lookup are explicit',()=>{
  assert.equal(directionFor('ar-EG'),'rtl');assert.equal(directionFor('tl'),'ltr');
  assert.equal(message('invalid','modeAi'),MESSAGES.en.modeAi);assert.equal(message('pl','unknown-key'),'unknown-key');
  assert.equal(message('en','__proto__'),'__proto__');assert(hasMessage('room_full'));assert.equal(hasMessage('__proto__'),false);assert.equal(hasMessage('Failed to fetch'),false);
});
test('every DOM translation and offline locale asset is covered',async()=>{
  const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
  for(const match of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g))assert(hasMessage(match[1]),`Unknown HTML key: ${match[1]}`);
  const source=await readFile(new URL('../web/sw.js',import.meta.url),'utf8');
  assert(source.includes("'./i18n.js'"));
  for(const {code}of LANGUAGES)assert(source.includes(`'${code}'`),`Offline precache missing ${code}`);
});
