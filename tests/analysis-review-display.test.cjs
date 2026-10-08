const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const Decimal = require('break_eternity.js');
const source = fs.readFileSync('src/components/tabs/statistics/MultiplierBreakdownEntry.vue', 'utf8');
const code = source.match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/^import[\s\S]*?;\s*/gm, '').replace('export default','module.exports =');
const context = { module:{exports:{}}, Decimal,
  DC:{ D0:new Decimal(0),D1:new Decimal(1),BEMAX:new Decimal('10^^9000000000000000') },
  PrimaryToggleButton:{},MultiplierBreakdownTotal:{},GameplayLimitSummary:{},
  BreakdownEntryInfo: class {},
  starResourceForEntry:()=>null,
  format:v=>String(v),formatX:v=>`×${v}`,formatPow:v=>`^${v}` };
vm.runInNewContext(code,context);
const methods = context.module.exports.methods;
const ui = { $legacyText:value=>value, $t:(key,p)=>key==='analysis.row.perTier'?`${p.value} per tier`:key };
function row(type,value,display='',extra={}) { return {data:{hasTransform:true, transformType:type,
  transformHasValue:value!==null, transformValue:new Decimal(value??1),
  transformBefore:new Decimal(1),transformAfter:new Decimal(52),transformDisplay:display,...extra}}; }

test('ordered rows retain their numeric multiplier or power beside descriptive text',()=>{
  assert.equal(methods.transformValueString.call(ui,row('multiply',42,'Continuum: 100')), '(×42; Continuum: 100)');
  assert.equal(methods.transformValueString.call(ui,row('power',0.42,'Slabdrill Infinity unlock')), '(^0.42; Slabdrill Infinity unlock)');
});
test('mixed categories show raw effects once without a redundant arrow or equivalent multiplier',()=>{
  assert.equal(methods.transformValueString.call(ui,row('formula',null,'×52',{transformAggregate:true})), '(×52)');
  assert.equal(methods.transformValueString.call(ui,row('formula',null,'×42; ^1.02 per tier',{transformAggregate:true})), '(×42; ^1.02 per tier)');
  assert.equal(methods.transformValueString.call(ui,row('formula',null,'',{transformAggregate:true})), '(×52)');
});
test('zero capacity inputs show zero without an invented 1 → 0 loss',()=>{
  const input=row('input',null,'',{transformAfter:new Decimal(0)});
  assert.equal(methods.transformValueString.call(ui,input),'(0)');
  assert.ok(methods.orderedEntryDelta.call({valueMode:'all',log10ForImpact:methods.log10ForImpact},
    {...input,data:{...input.data,isVisible:true}},false).eq(0));
});
test('leaf rows do not get child expanders and trusted symbols bypass word translation',()=>{
  assert.equal(methods.entryMatchesMode.call({valueMode:'all'}, {isActive:true}),true);
  assert.equal(methods.hasChildEntries.call({_cachedChildAvailability:[false,true]},0),false);
  assert.equal(methods.hasChildEntries.call({_cachedChildAvailability:[false,true]},1),true);
  assert.doesNotMatch(source,/v-html="\$legacyHtml\(barSymbol/u);
  const tab=fs.readFileSync('src/components/tabs/statistics/MultiplierBreakdownTab.vue','utf8');
  assert.match(tab,/v-html="symbol"/u);
  assert.match(tab,/<SlabdrillHuntFactors v-if="inCursedCore"/u);
  assert.doesNotMatch(tab,/projectedCapacityResource/u);
});
test('inactive legacy rows disappear immediately instead of keeping a recently visible x1 effect',()=>{
  assert.equal(methods.shouldShowEntry.call({valueMode:'all',isRecent:()=>true},
    {isActive:true,_hasTransform:false,data:{isVisible:false,lastVisibleAt:Date.now()}}),false);
});
test('neutral traced Glyph effects ignore floating point residue in before/after values',()=>{
  const script=fs.readFileSync('src/components/tabs/statistics/breakdown-entry-info.js','utf8')
    .replace(/^import[^;]+;\s*/gm,'').replace(/^export /gm,'');
  const ctx={Decimal,DC:context.DC,Vue:{observable:value=>value},GameDatabase:{multiplierTabValues:{X:{total:{
    isActive:true,transformValue:()=>({type:'power',before:100,after:100.000000000001,value:1})}}},multiplierTabTree:{}}};
  vm.runInNewContext(script+'\nthis.Entry=BreakdownEntryInfo;',ctx);
  const entry=new ctx.Entry('X_total');entry.update();
  assert.equal(entry.isVisible,false);assert.equal(entry.data.isVisible,false);
});
test('AG, RG, TG retain the vanilla atom, replication and dilation icon assignments',()=>{
  const galaxies=fs.readFileSync('src/core/secret-formula/multiplier-tab/galaxies.js','utf8');
  assert.match(galaxies,/antimatter:[\s\S]*?icon: MultiplierTabIcons.ANTIMATTER/u);
  assert.match(galaxies,/replicanti:[\s\S]*?icon: MultiplierTabIcons.SPECIFIC_GLYPH\("replication"\)/u);
  assert.match(galaxies,/tachyon:[\s\S]*?icon: MultiplierTabIcons.SPECIFIC_GLYPH\("dilation"\)/u);
});
