import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../src/lib/dockerGroups.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {makeGroupResolver,groupItems}=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const image=(ID,Repository)=>({ID,Repository});
const container=(ID,Names,project,ImageID)=>({ID,Names,ImageID,Labels:project?`com.docker.compose.project=${project},other=value`:''});
test('Compose labels keep unrelated project names separate',()=>{
 const a=container('a','common-api','alpha'),b=container('b','common-db','beta');
 const resolve=makeGroupResolver({images:[],containers:[a,b]});
 assert.equal(resolve(a),'alpha');assert.equal(resolve(b),'beta');
});
test('image ID joins a project even when its repository name differs',()=>{
 const img=image('sha256:1','renamed-frontend');
 const resolve=makeGroupResolver({images:[img],containers:[container('a','trivy-ui-frontend','trivy-ui','sha256:1')]});
 assert.equal(resolve(img),'trivy-ui');
});
test('matches named project prefixes without matching partial words',()=>{
 const imgs=[image('1','trivy-ui-local-frontend'),image('2','trivy-uibad')];
 const resolve=makeGroupResolver({images:imgs,containers:[container('a','custom','trivy-ui')]});
 assert.equal(resolve(imgs[0]),'trivy-ui');assert.equal(resolve(imgs[1]),'Other');
});
test('infers shared prefixes without hard-coded project names',()=>{
 const imgs=[image('1','kb-mb-demo'),image('2','kb-mb-demo-db'),image('3','kb-mb-demo-auth'),image('4','trivy-ui-backend'),image('5','trivy-ui-local-frontend')];
 const resolve=makeGroupResolver({images:imgs,containers:[]});
 assert.deepEqual(imgs.map(resolve),['kb-mb-demo','kb-mb-demo','kb-mb-demo','trivy-ui','trivy-ui']);
});
test('uses full inventory so filtering does not change group assignment',()=>{
 const imgs=[image('1','sample-api'),image('2','sample-worker'),image('3','alpine')];
 const resolve=makeGroupResolver({images:imgs,containers:[]});
 assert.equal(groupItems([imgs[0]],resolve)[0].name,'sample');
 assert.equal(resolve(imgs[2]),'Other');
});

test('supports underscore prefixes and puts Other last',()=>{
 const imgs=[image('1','orders_api'),image('2','orders_worker'),image('3','alpine')];
 const resolve=makeGroupResolver({images:imgs,containers:[]});
 assert.deepEqual(groupItems(imgs,resolve).map(g=>g.name),['orders','Other']);
});
