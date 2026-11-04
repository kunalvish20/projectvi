export function json(res,status,data) {res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));}
export function redirect(res,path) {res.statusCode=303;res.setHeader('Location',path);res.setHeader('Cache-Control','no-store');res.end();}
export async function readBody(req) {
 if(req.body!==undefined){if(typeof req.body==='string') return parseRaw(req.body);return req.body || {};}
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>16000) throw new Error('Request too large');}
 return parseRaw(raw);
}
function parseRaw(raw){if(!raw)return {};try{return JSON.parse(raw);}catch{return Object.fromEntries(new URLSearchParams(raw));}}
export const clean = (v,max=160) => String(v??'').trim().slice(0,max);
export function errorMessage(err){return /Missing server configuration/.test(err.message)?'Payment backend is not configured.':err.message||'Unexpected server error';}
