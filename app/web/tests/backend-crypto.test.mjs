import test from 'node:test';
import assert from 'node:assert/strict';
import {x25519,ed25519} from '@noble/curves/ed25519';
import {chacha20poly1305} from '@noble/ciphers/chacha';
import {hkdf} from '@noble/hashes/hkdf';
import {sha256} from '@noble/hashes/sha256';
import * as client from '../src/lib/backend/crypto.js';
const enc=new TextEncoder();
test('browser ciphertext hides input and decrypts a bound result',()=>{
 const sk=new Uint8Array(32).fill(7),pub=x25519.getPublicKey(sk);
 const input={holdings:[7,1,1],secret_marker:'PRIVATE_SAMPLE'};
 const packet=client.sealData(client.toHex(pub),input);
 assert.equal(JSON.stringify(packet.sealed).includes('PRIVATE_SAMPLE'),false);
 assert.deepEqual(Object.keys(packet.sealed).sort(),['ct','epk','nonce']);
 const salt=new Uint8Array([...packet.secret.epk,...packet.secret.tpk]);
 const key=hkdf(sha256,packet.secret.shared,salt,enc.encode('kalis/v1/answer'),32);
 const nonce=new Uint8Array(12).fill(5),answer={answer:{status:'feasible'},report:{all_ok:true}};
 const out={ok:true,tee_pubkey:client.toHex(pub),data_ct_sha256:packet.dataCtSha256,nonce:client.toB64(nonce),ct:client.toB64(chacha20poly1305(key,nonce).encrypt(enc.encode(JSON.stringify(answer))))};
 assert.deepEqual(client.openAnswer(packet.secret,out),answer);
 assert.throws(()=>client.openAnswer(packet.secret,{...out,data_ct_sha256:'wrong'}));
});
test('completion signature and pinned key distinguish valid and substituted identities',()=>{
 const sk=new Uint8Array(32).fill(9),pub=ed25519.getPublicKey(sk),completion=JSON.stringify({run_id:'run-1'});
 const sig=ed25519.sign(enc.encode(client.COMPLETION_PREFIX+completion),sk);
 const out={completion,completion_sig:client.toHex(sig),completion_pubkey:client.toHex(pub)};
 assert.equal(client.verifyCompletion(out,client.toHex(pub)).sigOk,true);
 assert.equal(client.verifyCompletion(out,'00'.repeat(32)).keyOk,false);
 assert.equal(client.verifyCompletion({...out,completion:JSON.stringify({run_id:'run-2'})},client.toHex(pub)).sigOk,false);
});

test('prompt answers never claim rule verification and invalid AI proof blocks use',()=>{
 const common={opened:{method_sha256:'method',manifest_sha256:'manifest',report:{all_ok:true,kind:'prompt',ai_calls:[]}},recheck:null,completion:{sigOk:true},attestation:{executed_build_ok:true,input_hash_ok:true,output_hash_ok:true},chain:{method_sha256:'method',manifest_sha256:'manifest'}};
 assert.equal(client.runVerdict(common).status,'attention');
 const invalid={...common,opened:{...common.opened,report:{...common.opened.report,ai_calls:[{ok:true,proof:{signature_valid:false}}]}}};
 assert.equal(client.runVerdict(invalid).status,'do_not_use');
});
