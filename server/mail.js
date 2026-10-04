// Email + SMS senders. Free options: Mailgun sandbox / Brevo / Resend (email), Twilio trial (SMS).
// With nothing configured they log to the console and report sent:false.
export async function sendMail({to,subject,text}){
 const key=process.env.MAILGUN_API_KEY,dom=process.env.MAILGUN_DOMAIN,from=process.env.MAIL_FROM||(dom?`rblink.chat <noreply@${dom}>`:'');
 if(!key||!dom){console.log(`[mail:not configured] to=${to} subject="${subject}"\n${text}`);return{sent:false}}
 try{const r=await fetch(`${process.env.MAILGUN_API_BASE||'https://api.mailgun.net'}/v3/${dom}/messages`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from('api:'+key).toString('base64')},body:new URLSearchParams({from,to,subject,text})});return{sent:r.ok}}catch{return{sent:false}}
}
export async function sendSms(to,text){
 const sid=process.env.TWILIO_SID,tok=process.env.TWILIO_TOKEN,from=process.env.TWILIO_FROM;
 if(!sid||!tok||!from){console.log(`[sms:not configured] to=${to} ${text}`);return{sent:false}}
 try{const r=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(sid+':'+tok).toString('base64')},body:new URLSearchParams({To:to,From:from,Body:text})});return{sent:r.ok}}catch{return{sent:false}}
}
