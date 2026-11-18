import {getProduct} from '../server/db.js';
import {couponPrice} from '../server/coupon.js';
import {json,readBody} from '../server/http.js';

export default async function handler(req,res) {
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  try {
    const body=await readBody(req);
    const quantity=Number(body.quantity);
    if(!Number.isInteger(quantity)||quantity<1||quantity>10)return json(res,400,{error:'Invalid quantity.'});
    const product=await getProduct('gta-collector-box');
    if(!product?.active||Number(product.price)<=0||Number(product.inventory)<quantity)return json(res,409,{error:'This product is currently unavailable.'});
    const quote=couponPrice(body.couponCode,product.price,quantity);
    return json(res,200,{amount:quote.amount,coupon:quote.coupon,subtotal:Number(product.price)*quantity});
  } catch(error) {
    if(['Invalid coupon code.','Coupon codes are currently unavailable.'].includes(error.message))return json(res,400,{error:error.message});
    console.error('payu-quote',error.message);
    return json(res,503,{error:'Could not check coupon right now.'});
  }
}
