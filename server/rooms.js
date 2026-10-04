// Meetings (Zoom/Meet style, up to ROOM_MAX people, WebRTC mesh) and live broadcasts (voice or video) with comments.
// Media is peer-to-peer; the server only does signaling over the authenticated WebSocket.
import crypto from 'crypto';
export default function(R,c){
 const{db,flush,send,json,wsSend}=c;db.rooms??={};
 const MAX=+process.env.ROOM_MAX||8,live=new Map(),L='abcdefghijkmnpqrstuvwxyz';
 const pick=n=>Array.from({length:n},()=>L[crypto.randomInt(L.length)]).join(''),code=()=>`${pick(3)}-${pick(4)}-${pick(3)}`;
 const ice=()=>{try{return JSON.parse(process.env.ICE_SERVERS)}catch{return[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]}};
 const R_=k=>live.get(k)||live.set(k,{peers:new Map(),chat:[]}).get(k);
 const au=x=>({id:x.u.id,name:x.u.name,avatar:x.u.avatar||'',state:x.state});
 R['POST /api/rooms']=async(q,s,u)=>{const b=await json(q),type=b.type==='live'?'live':'meeting',mode=b.mode==='audio'?'audio':'video',k=code();
  db.rooms[k]={code:k,title:String(b.title||'').trim().slice(0,100)||(type==='live'?`${u.name}'s live`:`${u.name}'s meeting`),type,mode,hostId:u.id,createdAt:new Date().toISOString(),endedAt:null};flush();send(s,200,db.rooms[k])};
 R['GET /api/rooms/live']=(q,s)=>{const out=Object.values(db.rooms).filter(r=>r.type==='live'&&!r.endedAt&&live.get(r.code)?.peers.has(r.hostId)).map(r=>({...r,host:{id:r.hostId,name:db.users.find(x=>x.id===r.hostId)?.name||'Host',avatar:db.users.find(x=>x.id===r.hostId)?.avatar||''},viewers:live.get(r.code).peers.size-1}));send(s,200,out)};
 R['GET /api/rooms/live'].open=true;
 R['GET /api/rooms/:code']=(q,s,u,P)=>{const r=db.rooms[P.code];if(!r)return send(s,404,{error:'Meeting not found. Check the code.'});send(s,200,{...r,ice:ice(),max:MAX,isHost:r.hostId===u.id,hostName:db.users.find(x=>x.id===r.hostId)?.name||'Host'})};
 R['POST /api/rooms/:code/end']=(q,s,u,P)=>{const r=db.rooms[P.code];if(!r)return send(s,404,{error:'Not found'});if(r.hostId!==u.id)return send(s,403,{error:'Only the host can end this'});r.endedAt=new Date().toISOString();flush();end(P.code);send(s,200,{ok:true})};
 const to=(k,m,except)=>{for(const p of live.get(k)?.peers.values()||[])if(p!==except)wsSend(p,m)};
 const end=k=>{to(k,{type:'rtc:ended',payload:{code:k}});live.delete(k)};
 const leave=conn=>{const k=conn.room;if(!k)return;conn.room=null;const r=live.get(k);if(!r)return;r.peers.delete(conn.u.id);to(k,{type:'rtc:left',payload:{id:conn.u.id}});
  const info=db.rooms[k];if(info?.type==='live'&&info.hostId===conn.u.id&&!info.endedAt){info.endedAt=new Date().toISOString();flush();end(k)}else if(!r.peers.size)live.delete(k)};
 return{
  onClose:leave,
  onMessage(conn,m){const p=m.payload||{},r=db.rooms[conn.room||p.code];
   if(m.type==='rtc:join'){const info=db.rooms[p.code];if(!info||info.endedAt)return wsSend(conn,{type:'rtc:error',payload:{message:'This room has ended or does not exist'}});
    leave(conn);const room=R_(p.code);if(!room.peers.has(conn.u.id)&&room.peers.size>=(info.type==='live'?MAX*4:MAX))return wsSend(conn,{type:'rtc:error',payload:{message:'This room is full'}});
    const old=room.peers.get(conn.u.id);if(old&&old!==conn){old.room=null;wsSend(old,{type:'rtc:error',payload:{message:'You joined from another tab'}})}
    conn.room=p.code;conn.state={};room.peers.set(conn.u.id,conn);
    wsSend(conn,{type:'rtc:peers',payload:{code:p.code,host:info.hostId,peers:[...room.peers.values()].filter(x=>x!==conn).map(au),chat:room.chat.slice(-100)}});to(p.code,{type:'rtc:joined',payload:au(conn)},conn);return}
   if(!conn.room||!r)return;const room=live.get(conn.room);if(!room)return;
   if(m.type==='rtc:signal'){const t=room.peers.get(p.to);if(t)wsSend(t,{type:'rtc:signal',payload:{from:conn.u.id,data:p.data}})}
   else if(m.type==='rtc:state'){conn.state={muted:!!p.muted,cameraOff:!!p.cameraOff,hand:!!p.hand,sharing:!!p.sharing};to(conn.room,{type:'rtc:state',payload:{id:conn.u.id,state:conn.state}},conn)}
   else if(m.type==='rtc:chat'){const text=String(p.text||'').trim().slice(0,500),audio=/^\/uploads\/[\w.-]+$/.test(p.audio||'')?p.audio:null;if(!text&&!audio)return;
    const msg={id:crypto.randomBytes(5).toString('hex'),from:{id:conn.u.id,name:conn.u.name,avatar:conn.u.avatar||''},text,audio,ts:Date.now()};room.chat.push(msg);if(room.chat.length>300)room.chat.shift();to(conn.room,{type:'rtc:chat',payload:msg})}
   else if(m.type==='rtc:kick'&&r.hostId===conn.u.id){const t=room.peers.get(p.to);if(t&&t!==conn){wsSend(t,{type:'rtc:ended',payload:{code:conn.room,kicked:true}});leave(t)}}
   else if(m.type==='rtc:leave')leave(conn)}
 };
}
