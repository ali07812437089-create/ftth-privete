const cp1252Reverse=new Map([
 ['€',0x80],['‚',0x82],['ƒ',0x83],['„',0x84],['…',0x85],['†',0x86],['‡',0x87],['ˆ',0x88],['‰',0x89],['Š',0x8a],['‹',0x8b],['Œ',0x8c],['Ž',0x8e],
 ['‘',0x91],['’',0x92],['“',0x93],['”',0x94],['•',0x95],['–',0x96],['—',0x97],['˜',0x98],['™',0x99],['š',0x9a],['›',0x9b],['œ',0x9c],['ž',0x9e],['Ÿ',0x9f]
]);
function byteForLegacyChar(c){
 const cp=c.codePointAt(0);
 if(cp<=0xff)return cp;
 return cp1252Reverse.get(c)??null;
}
function decodeLegacyUtf8(part){
 const bytes=[];
 for(const c of part){const n=byteForLegacyChar(c);if(n===null)return null;bytes.push(n)}
 try{return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(bytes))}catch{return null}
}
function mojibakeScore(s){return (s.match(/[ØÙÃÂ]/g)||[]).length*3+(s.match(/[\u0080-\u009f]/g)||[]).length+(s.match(/[„…‚ƒˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g)||[]).length}
function repairLegacyRun(part){
 if(!/[ØÙÃÂ]/.test(part))return part;
 let out=part;
 for(let pass=0;pass<3;pass++){
  if(!/[ØÙÃÂ]/.test(out))break;
  const candidate=decodeLegacyUtf8(out);
  if(!candidate)break;
  const hasArabic=/[\u0600-\u06ff]/.test(candidate);
  if(!hasArabic&&mojibakeScore(candidate)>=mojibakeScore(out))break;
  out=candidate;
 }
 return out;
}
export function repairArabic(value){
 if(typeof value!=='string'||!/[ØÙÃÂ]/.test(value))return value;
 return value.replace(/[\u0000-\u00ff\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2010-\u203a\u20ac\u2122]+/g,repairLegacyRun);
}
export function repairData(value){
 if(typeof value==='string')return repairArabic(value);
 if(Array.isArray(value))return value.map(repairData);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,repairData(v)]));
 return value;
}
