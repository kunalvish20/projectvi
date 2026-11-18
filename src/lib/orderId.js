export function formatOrderId(number){
 const value=Number(number);
 return Number.isSafeInteger(value)&&value>0?`PV-${String(value).padStart(2,'0')}`:'';
}
