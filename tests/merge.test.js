import test from 'node:test';import assert from 'node:assert/strict';
import {union,mergeSnapshots} from '../src/auth/merge.ts';
test('union keeps local copy and appends remote-only items',()=>{
 const r=union([{id:1,v:'local'}],[{id:1,v:'remote'},{id:2}]);assert.deepEqual(r,[{id:1,v:'local'},{id:2}])});
test('merge keeps messages from both people, in time order',()=>{
 const l={rblink_messages:JSON.stringify({c1:[{id:'a',timestamp:'2026-01-01T10:00:00Z'}]})},r={rblink_messages:JSON.stringify({c1:[{id:'b',timestamp:'2026-01-01T09:00:00Z'}],c2:[{id:'z',timestamp:'2026-01-02T00:00:00Z'}]})};
 const m=JSON.parse(mergeSnapshots(l,r).rblink_messages);assert.deepEqual(m.c1.map(x=>x.id),['b','a']);assert.equal(m.c2[0].id,'z')});
test('merge unions users and falls back to remote when nothing local',()=>{
 const m=mergeSnapshots({rblink_users:'[{"id":"u1"}]'},{rblink_users:'[{"id":"u2"}]',rblink_channels:'[{"id":"c"}]'});
 assert.equal(JSON.parse(m.rblink_users).length,2);assert.equal(m.rblink_channels,'[{"id":"c"}]')});
test('merge survives corrupt JSON by keeping local data',()=>{
 assert.equal(mergeSnapshots({rblink_users:'{bad'},{rblink_users:'[]'}).rblink_users,'{bad')});
