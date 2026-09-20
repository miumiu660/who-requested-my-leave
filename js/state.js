'use strict';
const SAVE_KEY='qh_leave_v4';
function freshState(endings=[],catEndingCleared=false){return {version:2,started:false,solved:{},evidence:[],attachments:[],chats:[],trips:[],reviewed:[],notes:[],businessDone:[],compDocs:[],endings,catEndingCleared,ending:null,app:'desktop',workBlocked:false,leaveDiscovered:false,migrationSource:false,migrationLog:false,earliest:false,salaryViewed:false,borrowReviewed:false,selfOpinionUnlocked:false,otherHandled:false,catWarnings:0,catChoice:null};}
function loadState(){try{const d=JSON.parse(localStorage.getItem(SAVE_KEY));if(d&&d.version===2)return {...freshState(),...d,solved:{...d.solved}};}catch(e){}return freshState();}
let state=loadState();
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch(e){return false;}}
function allowed(g){return !g||!!state.solved[g]||!!state[g];}
function appOpen(id){return ['desktop','business','chat','oa','hr','finance','drive','self'].includes(id);}
function note(id,text){if(!state.notes.some(n=>n.id===id))state.notes.push({id,text});}
function addUnique(list,id){if(!list.includes(id))list.push(id);}
function puzzleNext(){return ['todayPresence','marriage','travel','migration','leaveBalance','compensation','origin'].find(k=>!state.solved[k]);}
function transition(action,payload={}){
 let error='';const fail=s=>{error=s;};
 if(action==='businessCheck'){if(payload.id!=='report')fail('任务不存在。');else{state.workBlocked=true;note('workBlocked','周运营数据提交失败：员工状态异常。');}}
 else if(action==='discoverLeave'){if(!state.chats.includes('opening'))fail('状态来源尚未同步。');else{state.leaveDiscovered=true;note('leaveDiscovered','OA记录 QH-LV-27 被同步至员工 OP-026，当前状态显示为病假。');}}
 else if(action==='presence'){if(!state.leaveDiscovered)fail('尚未发现当前假单。');else if(!DATA.presence.some(x=>x[0]===payload.id))fail('记录不存在。');else{addUnique(state.evidence,payload.id);note('presence:'+payload.id,'28日 '+DATA.presence.find(x=>x[0]===payload.id).slice(1).join(' · '));if(state.evidence.length===DATA.presence.length){state.solved.todayPresence=true;note('presenceDone','本人对病假存在异议：四项今日在岗记录已确认。身份核验开放。');}}}
 else if(action==='attachment'){const a=DATA.attachments[payload.id];const accessible={temp:'earliest',catSurgery:'todayPresence',wedding:'todayPresence',travel:'marriage',box:'travel',plant:'travel',emotion:'travel',catReview:'travel',catWell:'migration',door:'migration',rest:null,birth:'travel'};if(!a||!allowed(accessible[payload.id]))fail('附件尚未开放。');else{addUnique(state.attachments,payload.id);if(payload.id==='catSurgery')addUnique(state.reviewed,6);if(payload.id!=='wedding')note('attachment:'+payload.id,a.note);}}
 else if(action==='zoomWedding'){if(!state.attachments.includes('wedding'))fail('请先打开附件。');else{addUnique(state.attachments,'weddingDetail');note('attachment:wedding',DATA.attachments.wedding.note);}}
 else if(action==='chat'){const c=DATA.chats.find(c=>c.id===payload.id);if(!c||!allowed(c.gate))fail('历史记录尚未开放。');else{addUnique(state.chats,c.id);note('chat:'+c.id,'已查看：'+c.channel+' / 本月'+c.date+'日。');if(c.id==='migrationChat'&&state.migrationSource){state.solved.migration=true;addUnique(state.reviewed,18);note('migration','18日迁移的材料副本写入OP-026，原业务记录保持不变。23日与27日的新材料也沿用未清理的暂存单，并由后续同步继续写入。');}if(c.id==='borrowChat')addUnique(state.reviewed,23);if(c.id==='recentChat')addUnique(state.reviewed,27);}}
 else if(action==='review'){const a=DATA.anomalies.find(x=>x.day===payload.day);if(!a||!allowed(a.gate))fail('请先完成前序核验。');else addUnique(state.reviewed,a.day);}
 else if(action==='marriage'){if(!state.attachments.includes('wedding')||!state.chats.includes('weddingChat'))fail('还需要附件和喜宴聊天互相印证。');else if(payload.person!=='何骏')fail('证据不足，该员工与10日婚宴资料无法对应。');else{state.solved.marriage=true;addUnique(state.reviewed,10);note('marriage','10日实际申请人已核实。');}}
 else if(action==='trip'){if(!state.solved.marriage||!DATA.trips.some(t=>t.city===payload.city))fail('差旅核验尚未开放。');else addUnique(state.trips,payload.city);}
 else if(action==='travel'){if(!state.solved.marriage||state.trips.length!==4||!state.chats.includes('tripChat'))fail('原始差旅单与项目排期尚未完成一致性核对。');else if(DATA.trips.some(t=>payload[t.city]!==t.answer))fail('人员与项目编号不一致。');else{state.solved.travel=true;addUnique(state.reviewed,14);note('travel','四笔原始差旅均已正常报销；张佳诚档案中的四城信息属于重复关联。');}}
 else if(action==='migrationLog'){if(!state.solved.travel)fail('操作日志尚未开放。');else{state.migrationLog=true;note('migrationLog','18日15:01—15:07，HR-03 / 10.0.0.23 / 账号刘一颖，连续写入7条记录。');}}
 else if(action==='migrationSource'){if(!state.migrationLog||!state.attachments.includes('box')||!state.attachments.includes('catReview'))fail('导入附件与操作日志尚未形成完整批次。');else if(payload.person!=='刘一颖')fail('所选人员与终端登录账号不一致。');else{state.migrationSource=true;note('migrationSource','18日批次由刘一颖执行，暂存单关联编号OP-026。');}}
 else if(action==='leaveBalance'){const missing=[];if(!state.solved.migration)missing.push('18日迁移来源');if(!state.chats.includes('borrowChat'))missing.push('23日流程协调记录');if(!state.chats.includes('recentChat'))missing.push('27日相关会话');for(const d of [10,23,27])if(!state.reviewed.includes(d))missing.push(`${d}日假单材料`);if(missing.length)fail(`尚未核对：${missing.join('、')}。`);else if(+payload.d10!==1||+payload.d23!==2||+payload.d27!==2||+payload.actual!==0)fail('核算不一致。病假天数不等于占用年假天数。');else{state.solved.leaveBalance=true;note('leaveBalance','年假5→4→2→0；本人实际休年假0天。薪资核算开放。');}}
 else if(action==='salary'){if(!state.solved.leaveBalance)fail('年假余额尚未完成核对。');else{state.salaryViewed=true;note('salary','考勤影响665.52元；财务另行建立6000元历史数据异常专项补发。');}}
 else if(action==='compDocument'){if(!state.salaryViewed||!['manual','automatic'].includes(payload.id))fail('薪资明细尚未开放。');else addUnique(state.compDocs,payload.id);}
 else if(action==='compensation'){if(!['manual','automatic'].every(id=>state.compDocs.includes(id)))fail('两类薪资项目尚未完成核对。');else if(+payload.manual!==6000||+payload.automatic!==1150)fail('人工补发与自动福利的金额分类不一致。');else{state.solved.compensation=true;note('compensation','专项补发6000元由HR与财务单独审批，系统自动福利1150元另计。年假及身份资料仍未恢复。');}}
 else if(action==='earliest'){if(!state.solved.compensation)fail('完整历史索引尚未开放。');else state.earliest=true;}
 else if(action==='origin'){if(!state.chats.includes('originChat')||!state.attachments.includes('temp'))fail('首条暂存记录仍有材料未核对。');else if(payload.beneficiary!=='罗晨'||payload.proposer!=='周敏')fail('实际请假人与暂存模板经办人不一致。');else{addUnique(state.reviewed,3);state.solved.origin=true;note('origin','3日，周敏以张佳诚的员工编号建立临时材料暂存模板；罗晨的正式病假始终登记在本人名下。');}}
 else if(action==='opinion'){if(!state.solved.origin)fail('尚未完成追溯。');else if((payload.text||'').replace(/[？?\s]/g,'')!=='我的意见呢')fail('意见已暂存。请再看看各部门都有的那个字段。');else state.selfOpinionUnlocked=true;}
 else if(action==='handleOthers'){if(!state.solved.origin)fail('源记录尚未完成追溯。');else{state.otherHandled=true;note('otherHandled','六项重复关联已标记为非本人资料；宠物医疗记录仍待本人确认。');}}
 else if(action==='catWarning'){if(!state.otherHandled)fail('请先处理其他异常。');else{state.catWarnings=Math.min(3,state.catWarnings+1);if(state.catWarnings===3)finish('cat');}}
 else if(action==='ending'){if(!state.solved.origin)fail('资料尚未完成核验。');else if(payload.id==='true'&&(!state.selfOpinionUnlocked||!payload.confirmRequired))fail('请开启“身份使用需本人确认”。');else if(!['true','good','normal'].includes(payload.id))fail('无效处理方式。');else finish(payload.id);}
 else fail('未知操作。');
 if(!error)persist();return {ok:!error,error};
}
function finish(id){if(!state.checkpoint)state.checkpoint=JSON.stringify({...state,ending:null,app:'self',checkpoint:null});state.ending=id;addUnique(state.endings,id);if(id==='cat')state.catEndingCleared=true;state.app='ending';}
function resetGame(all=false){const checkpoint=all?null:state.checkpoint;state=freshState(all?[]:state.endings,all?false:state.catEndingCleared);state.checkpoint=checkpoint;persist();}
function resumeFinal(){if(!state.solved.origin&&state.checkpoint){const endings=state.endings,catEndingCleared=state.catEndingCleared,checkpoint=state.checkpoint;state={...JSON.parse(checkpoint),endings,catEndingCleared,checkpoint};}if(!state.solved.origin)return false;state.started=true;state.ending=null;state.app='self';state.catWarnings=0;state.catChoice=null;persist();return true;}
