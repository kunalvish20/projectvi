import {json} from '../server/http.js';

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 return json(res,410,{error:'Checkout is available through PayU only.'});
}
