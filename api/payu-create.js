import crypto from 'node:crypto';
import {db,getProduct} from '../server/db.js';
import {json,readBody,clean,errorMessage} from '../server/http.js';
import {requestHash,payuBase,accessHash} from '../server/payu.js';
import {getHandlingOption,getOrderTotal} from '../src/data/handling.js';
const PRODUCT_ID='gta-collector-box';
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const body=await readBody(req);const customer=body.customer||{};
  const quantity=Number(body.quantity);
  if(!Number.isInteger(quantity)||quantity<1||quantity>10)return json(res,400,{error:'Invalid quantity (1–10).'});
  const handling=getHandlingOption(body.handlingOption ?? 'standard');
  if(!handling)return json(res,400,{error:'Please select a valid handling option.'});
  const name=clean(customer.name,100),email=clean(customer.email,180).toLowerCase(),phone=clean(customer.phone,15),address=clean(customer.address,300),city=clean(customer.city,80),state=clean(customer.state,80),pincode=clean(customer.pincode,6);
  if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||!/^\d{10}$/.test(phone)||address.length<5||city.length<2||state.length<2||!/^\d{6}$/.test(pincode))return json(res,400,{error:'Please provide valid contact and delivery details.'});
  const product=await getProduct(PRODUCT_ID);
  if(!product?.active||!Number.isFinite(Number(product.price))||Number(product.price)<=0)return json(res,409,{error:'This product is currently unavailable.'});
  if(Number(product.inventory)<quantity)return json(res,409,{error:'Insufficient stock for this order.'});
  const site=process.env.PUBLIC_SITE_URL?.replace(/\/$/,'');
  if(!site || !/^https?:\/\//.test(site))throw new Error('Missing server configuration: PUBLIC_SITE_URL');
  const txnid=`PV${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const accessToken=crypto.randomBytes(24).toString('hex');
  const amount=getOrderTotal(product.price,quantity,handling.id).toFixed(2);
  const fields={key:process.env.PAYU_MERCHANT_KEY,txnid,amount,productinfo:product.name,firstname:name.split(/\s+/)[0],email,phone,surl:`${site}/api/payu-callback`,furl:`${site}/api/payu-callback`,udf1:'',udf2:'',udf3:'',udf4:'',udf5:''};
  const hash=requestHash(fields);
  const rows=await db('orders',{method:'POST',body:{txnid,access_hash:accessHash(accessToken),customer_name:name,customer_email:email,customer_phone:phone,address,city,state,pincode,quantity,amount:Number(amount),product_id:product.id,product_name:product.name,order_status:'pending_payment',payment_status:'pending',payment_provider:'payu',notes:`Handling: ${handling.label} (INR ${handling.fee})`}});
  if(!rows?.[0])throw new Error('Unable to create the order.');
  return json(res,200,{gateway:`${payuBase()}/_payment`,fields:{...fields,hash},txnid,accessToken,handlingOption:handling.id,handlingFee:handling.fee});
 }catch(err){console.error('payu-create',err.message);return json(res,500,{error:errorMessage(err)});}
}
