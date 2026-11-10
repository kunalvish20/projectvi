import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
// Vite normally does not execute Vercel API routes. This middleware makes npm run dev work locally.
function localApi(){return {name:'local-vercel-functions',configureServer(server){
 server.middlewares.use(async(req,res,next)=>{
  const route=new URL(req.url,'http://localhost').pathname;
  const routes={'/api/payu-create':'payu-create.js','/api/payu-callback':'payu-callback.js','/api/payu-status':'payu-status.js','/api/creator-apply':'creator-apply.js','/api/checkout-preview':'checkout-preview.js'};
  if(!routes[route])return next();
  try{const {default:handler}=await import(pathToFileURL(path.join(dir,'api',routes[route])).href);await handler(req,res);}
  catch(e){console.error(e);if(!res.writableEnded){res.statusCode=500;res.end('Server error');}}
 });
}};}
export default defineConfig(({mode})=>{const values=loadEnv(mode,dir,'');for(const [key,value] of Object.entries(values)){if(!(key in process.env))process.env[key]=value;}return {plugins:[react(),localApi()]};});
